import bcrypt from 'bcrypt';
import * as adminModel from '../models/adminModel.js';
import { findUserById } from '../models/userModel.js';
import { generateRandomPassword, sendNewPasswordEmail } from './otp.js';

const ITEMS_PER_PAGE = 10;

// Helper function để tính page numbers
function getPageNums(page_counts) {
    return Array.from({length: page_counts}, (_, i) => {
        return {'value': i + 1};
    });
}

// middleware
export async function loadSystemConfig(req, res, next) {
    try {
        const { data, error } = await adminModel.getSystemConfig();
        if (error) {
            console.error(error);
            return next();
        }
        const configMap = {};
        data.forEach(c => configMap[c.key] = Number(c.value));

        req.app.locals.highLightTime = configMap.highLightTime;
        req.app.locals.relativeTimeDays = configMap.relativeTimeDays;
        req.app.locals.extendBoundary = configMap.extendBoundary;
        req.app.locals.extendTime = configMap.extendTime;

        next();
    } catch (err) {
        console.error(err);
        next();
    }
}

//admin dashboard
export async function renderAdminDashboard(req, res) {
    try {
        // Get page numbers from query
        const catPage = parseInt(req.query.catPage) || 1;
        const proPage = parseInt(req.query.proPage) || 1;
        const userPage = parseInt(req.query.userPage) || 1;

        // Calculate offsets
        const catOffset = (catPage - 1) * ITEMS_PER_PAGE;
        const proOffset = (proPage - 1) * ITEMS_PER_PAGE;
        const userOffset = (userPage - 1) * ITEMS_PER_PAGE;

        // Load paginated data
        const { data: categoriesData } = await adminModel.findCategoriesPaginated(ITEMS_PER_PAGE, catOffset);
        const { count: catTotal } = await adminModel.countCategories();
        const catPageCount = Math.ceil(catTotal / ITEMS_PER_PAGE);

        const { data: productsData } = await adminModel.findProductsPaginated(ITEMS_PER_PAGE, proOffset);
        const { count: proTotal } = await adminModel.countProducts();
        const proPageCount = Math.ceil(proTotal / ITEMS_PER_PAGE);

        const { data: usersData } = await adminModel.findUsersPaginated(ITEMS_PER_PAGE, userOffset);
        const { count: userTotal } = await adminModel.countUsers();
        const userPageCount = Math.ceil(userTotal / ITEMS_PER_PAGE);

        const { data: upgradeRequestsData } = await adminModel.findAllUpgradeRequests();

        // Add product count for categories
        const categoriesWithCount = await Promise.all(
            (categoriesData || []).map(async (cat) => {
                const { count } = await adminModel.countProductsByCategory(cat.category_id);
                return { ...cat, productCount: count || 0 };
            })
        );

        // Render dashboard với pagination data
        res.render('vwAdmin/admin_dashboard', {
            layout: 'admin',
            categories: categoriesWithCount,
            catPage: catPage,
            catPrevPage: catPage - 1,
            catNextPage: catPage + 1,
            catPageCount: catPageCount,
            catPageNums: getPageNums(catPageCount),
            
            products: productsData || [],
            proPage: proPage,
            proPrevPage: proPage - 1,
            proNextPage: proPage + 1,
            proPageCount: proPageCount,
            proPageNums: getPageNums(proPageCount),
            
            users: usersData || [],
            userPage: userPage,
            userPrevPage: userPage - 1,
            userNextPage: userPage + 1,
            userPageCount: userPageCount,
            userPageNums: getPageNums(userPageCount),
            
            upgradeRequests: upgradeRequestsData || [],
            
            // Success/Error messages
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error rendering admin dashboard:', error);
        res.status(500).send('Server error');
    }
}

// category
export async function addCategory(req, res) {
    const { category_name, parent_cat } = req.body;
    const catPage = req.query.catPage || 1;
    
    if (!category_name || !category_name.trim()) {
        return res.redirect(`/admin?catPage=${catPage}&error=Category name is required`);
    }
    
    const { error } = await adminModel.createCategory(
        category_name.trim(), 
        parent_cat || null
    );
    
    if (error) {
        return res.redirect(`/admin?catPage=${catPage}&error=` + encodeURIComponent(error.message));
    }
    
    res.redirect(`/admin?catPage=${catPage}&success=Category created successfully`);
}

export async function editCategory(req, res) {
    const { id } = req.params;
    const { category_name, parent_cat, _method } = req.body;
    const catPage = req.query.catPage || 1;
    
    // Xử lý method override cho PUT
    if (_method !== 'PUT') {
        return res.redirect(`/admin?catPage=${catPage}`);
    }
    
    if (!category_name || !category_name.trim()) {
        return res.redirect(`/admin?catPage=${catPage}&error=Category name is required`);
    }
    
    const { error } = await adminModel.updateCategory(
        id, 
        category_name.trim(), 
        parent_cat || null
    );
    
    if (error) {
        return res.redirect(`/admin?catPage=${catPage}&error=` + encodeURIComponent(error.message));
    }
    
    res.redirect(`/admin?catPage=${catPage}&success=Category updated successfully`);
}

export async function removeCategory(req, res) {
    const { id } = req.params;
    const catPage = req.query.catPage || 1;
    
    const { error } = await adminModel.deleteCategory(id);
    
    if (error) {
        return res.redirect(`/admin?catPage=${catPage}&error=` + encodeURIComponent(error.message));
    }
    
    res.redirect(`/admin?catPage=${catPage}&success=Category deleted successfully`);
}

// product
export async function deleteProduct(req, res) {
    const { id } = req.params;
    const proPage = req.query.proPage || 1;
    
    const { error } = await adminModel.removeProduct(id);
    
    if (error) {
        return res.redirect(`/admin?proPage=${proPage}&error=` + encodeURIComponent(error.message));
    }
    
    res.redirect(`/admin?proPage=${proPage}&success=Product removed successfully`);
}

// user
export async function addUser(req, res) {
    const { full_name, email, password, role, address } = req.body;
    const userPage = req.query.userPage || 1;
    
    if (!full_name || !email || !password) {
        return res.redirect(`/admin?userPage=${userPage}&error=Full name, email, and password are required`);
    }
    
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const { error } = await adminModel.createUserByAdmin(
            full_name, 
            email, 
            password_hash, 
            role || 'bidder', 
            address || null
        );
        
        if (error) {
            if (error.message.includes('duplicate key')) {
                return res.redirect(`/admin?userPage=${userPage}&error=Email already exists`);
            }
            return res.redirect(`/admin?userPage=${userPage}&error=` + encodeURIComponent(error.message));
        }
        
        res.redirect(`/admin?userPage=${userPage}&success=User created successfully`);
    } catch (err) {
        res.redirect(`/admin?userPage=${userPage}&error=Server error`);
    }
}

export async function editUser(req, res) {
    const { id } = req.params;
    const { full_name, email, role, address, _method } = req.body;
    const userPage = req.query.userPage || 1;
    
    // Xử lý method override cho PUT
    if (_method !== 'PUT') {
        return res.redirect(`/admin?userPage=${userPage}`);
    }
    
    const updates = {};
    if (full_name) updates.full_name = full_name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (address !== undefined) updates.address = address;
    
    const { error } = await adminModel.updateUser(id, updates);
    
    if (error) {
        if (error.message.includes('duplicate key')) {
            return res.redirect(`/admin?userPage=${userPage}&error=Email already exists`);
        }
        return res.redirect(`/admin?userPage=${userPage}&error=` + encodeURIComponent(error.message));
    }
    
    res.redirect(`/admin?userPage=${userPage}&success=User updated successfully`);
}

export async function removeUser(req, res) {
    const { id } = req.params;
    const userPage = req.query.userPage || 1;
    
    const { error } = await adminModel.deleteUser(id);
    
    if (error) {
        return res.redirect(`/admin?userPage=${userPage}&error=` + encodeURIComponent(error.message));
    }
    
    res.redirect(`/admin?userPage=${userPage}&success=User deleted successfully`);
}

// request
export async function approveUpgrade(req, res) {
    const { id } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
        return res.redirect('/admin?error=User ID is required');
    }
    
    const { error } = await adminModel.approveUpgradeRequest(id, user_id);
    
    if (error) {
        return res.redirect('/admin?error=' + encodeURIComponent(error.message));
    }
    
    res.redirect('/admin?success=Upgrade request approved successfully');
}

export async function rejectUpgrade(req, res) {
    const { id } = req.params;
    
    const { error } = await adminModel.rejectUpgradeRequest(id);
    
    if (error) {
        return res.redirect('/admin?error=' + encodeURIComponent(error.message));
    }
    
    res.redirect('/admin?success=Upgrade request rejected successfully');
}

// system

export async function renderAdminConfig(req, res) {
    try {
        const { data, error } = await adminModel.getSystemConfig();

        if (error) {
            console.error(error);
            return res.render('vwAdmin/admin_config', {
                layout: 'admin',
                error: 'Cannot load system config'
            });
        }

        const configMap = {};
        data.forEach(c => configMap[c.key] = c.value);

        res.render('vwAdmin/admin_config', {
            layout: 'admin',
            config: configMap,
            success: req.query.success,
            error: req.query.error
        });
    } catch (e) {
        res.status(500).send("Server error");
    }
}

export async function updateAdminConfig(req, res) {
    const { highLightTime, relativeTimeDays, extendBoundary, extendTime } = req.body;

    try {
        const updates = [
            { key: 'highLightTime', value: highLightTime },
            { key: 'relativeTimeDays', value: relativeTimeDays },
            { key: 'extendBoundary', value: extendBoundary },
            { key: 'extendTime', value: extendTime },
        ];

        for (const item of updates) {
            await adminModel.updateSystemConfig(item.key, item.value);
        }

        res.redirect('/admin/others?success=Updated successfully');
    } catch (error) {
        res.redirect('/admin/others?error=' + encodeURIComponent(error.message));
    }
}


export async function resetUserPassword(req, res) {
    const userId = req.params.id;

    try {
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        const newRawPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(newRawPassword, 10);

        const { error: updateError } = await adminModel.updateUserPassword(userId, hashedPassword);
        if (updateError) {
            return res.status(500).json({ success: false, message: 'Không thể cập nhật DB' });
        }

        await sendNewPasswordEmail(user.email, newRawPassword);

        return res.json({ 
            success: true, 
            message: 'Mật khẩu đã được reset và gửi tới email người dùng.' 
        });

    } catch (err) {
        console.error('Reset Password Error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Có lỗi xảy ra trong quá trình reset mật khẩu.' 
        });
    }
}
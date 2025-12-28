import nodemailer from "nodemailer";
import * as userModel from "../models/userModel.js";
import * as productModel from "../models/productModel.js";
import * as emailLogModel from "../models/emailLogModel.js";

const adminGmail = process.env.EMAIL_USER;
const adminGmailPass = process.env.EMAIL_PASS;
const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// transporter config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: adminGmail,
    pass: adminGmailPass,
  },
});

// helper functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDateTime(datetime) {
  return new Date(datetime).toLocaleString("vi-VN");
}

function maskName(name) {
  if (!name) return "";
  const show = name.slice(-3);
  return "*".repeat(name.length - show.length) + show;
}

// email when bid success
export async function sendBidSuccessEmails(
  productId,
  bidderId,
  bidAmount,
  previousBidderId
) {
  try {
    const product = await productModel.findProById(productId);
    if (!product) return;

    const seller = await userModel.findUserById(product.seller_id);
    const bidder = await userModel.findUserById(bidderId);

    // bidder trước đó 
    const previousBidder =
      previousBidderId && previousBidderId !== bidderId
        ? await userModel.findUserById(previousBidderId)
        : null;

    const productLink = `${BASE_URL}/product/details/${productId}`;
    const sentEmails = [];

    // seller
    if (seller?.email) {
      await transporter.sendMail({
        from: adminGmail,
        to: seller.email,
        subject: `Có lượt ra giá mới cho "${product.product_name}"`,
        html: `
          <p>Sản phẩm có giá mới: <b>${formatCurrency(bidAmount)}</b></p>
          <p>Người ra giá: ${maskName(bidder.full_name)}</p>
          <a href="${productLink}">Xem chi tiết</a>
        `,
      });
      sentEmails.push(seller.email);
    }

    // curent bidder
    if (bidder?.email) {
      await transporter.sendMail({
        from: adminGmail,
        to: bidder.email,
        subject: `Đặt giá thành công "${product.product_name}"`,
        html: `
          <p>Bạn đang dẫn đầu với giá <b>${formatCurrency(bidAmount)}</b></p>
          <a href="${productLink}">Theo dõi sản phẩm</a>
        `,
      });
      sentEmails.push(bidder.email);
    }

    // previous bidder
    if (previousBidder?.email) {
      console.log("Previous bidder email:", previousBidder.email);
      await transporter.sendMail({
        from: adminGmail,
        to: previousBidder.email,
        subject: `Bạn đã bị vượt giá "${product.product_name}"`,
        html: `
          <p>Giá mới: <b>${formatCurrency(bidAmount)}</b></p>
          <p>Bạn đã không còn là người dẫn đầu.</p>
          <a href="${productLink}">Đặt giá lại</a>
        `,
      });
      sentEmails.push(previousBidder.email);
    }

    await emailLogModel.logEmail(productId, "bid_success", sentEmails);
  } catch (err) {
    console.error("sendBidSuccessEmails error:", err);
  }
}


// email when bid denied
export async function sendBidDeniedEmail(productId, bidderId) {
  try {
    const product = await productModel.findProById(productId);
    const bidder = await userModel.findUserById(bidderId);
    if (!product || !bidder?.email) return;

    await transporter.sendMail({
      from: adminGmail,
      to: bidder.email,
      subject: `🚫 Bị từ chối ra giá "${product.product_name}"`,
      html: `<p>Người bán đã từ chối quyền ra giá của bạn.</p>`,
    });

    await emailLogModel.logEmail(productId, "bid_denied", [bidder.email]);
  } catch (err) {
    console.error("sendBidDeniedEmail error:", err);
  }
}

// bid end – no bidder
export async function sendAuctionEndedNoBidderEmail(productId) {
  try {
    const product = await productModel.findProById(productId);
    if (!product) return;

    console.log("Product info:", product);
    const seller = await userModel.findUserById(product.seller_id);
    console.log("Seller info:", seller);
    if (!seller?.email) return;

    await transporter.sendMail({
      from: adminGmail,
      to: seller.email,
      subject: `Đấu giá kết thúc – Không có người mua`,
      html: `<p>Sản phẩm <b>${product.product_name}</b> không có lượt ra giá.</p>`,
    });

    await emailLogModel.logEmail(productId, "auction_ended_no_bidder", [
      seller.email,
    ]);
  } catch (err) {
    console.error("sendAuctionEndedNoBidderEmail error:", err);
  }
}

// bid end – with winner
export async function sendAuctionEndedWithWinnerEmails(productId) {
  console.log("sendAuctionEndedWithWinnerEmails for product:", productId);
  try {
    const product = await productModel.findProById(productId);
    if (!product?.highest_bidder) return;

    const seller = await userModel.findUserById(product.seller_id);
    const winner = await userModel.findUserById(product.highest_bidder);

    const sentEmails = [];

    if (seller?.email) {
      console.log("Seller email:", seller.email);
      await transporter.sendMail({
        from: adminGmail,
        to: seller.email,
        subject: `Sản phẩm đã bán thành công`,
        html: `<p>Giá bán: ${formatCurrency(product.current_price)}</p>`,
      });
      sentEmails.push(seller.email);
    }

    if (winner?.email) {
      console.log("Winner email:", winner.email);
      await transporter.sendMail({
        from: adminGmail,
        to: winner.email,
        subject: `🎉 Bạn đã thắng đấu giá`,
        html: `<p>Bạn đã thắng sản phẩm <b>${product.product_name}</b></p>`,
      });
      sentEmails.push(winner.email);
    }

    await emailLogModel.logEmail(
      productId,
      "auction_ended_winner",
      sentEmails
    );
  } catch (err) {
    console.error("sendAuctionEndedWithWinnerEmails error:", err);
  }
}

// email when new question asked
export async function sendQuestionAskedEmail(productId, questionId) {
  try {
    const product = await productModel.findProById(productId);
    if (!product) return;

    const seller = await userModel.findUserById(product.seller_id);
    if (!seller?.email) return;

    await transporter.sendMail({
      from: adminGmail,
      to: seller.email,
      subject: `Có câu hỏi mới`,
      html: `<p>Sản phẩm <b>${product.product_name}</b> có câu hỏi mới.</p>`,
    });

    await emailLogModel.logEmail(productId, "question_asked", [seller.email]);
  } catch (err) {
    console.error("sendQuestionAskedEmail error:", err);
  }
}

// email when answer posted
export async function sendAnswerPostedEmails(productId, questionId) {
  try {
    const product = await productModel.findProById(productId);
    if (!product) return;

    const qaList = await productModel.getQAHistory(productId);
    const question = qaList.find(q => q.question_id === questionId);
    if (!question?.answer?.length) return;

    const seller = await userModel.findUserById(product.seller_id);
    const productLink = `${BASE_URL}/product/details/${productId}`;

    const recipients = new Set();

    // asker
    const asker = await userModel.findUserById(question.user_id);
    if (asker?.email) recipients.add(asker.email);

    // ( other ) bidders who viewed the Q&A
    const bidHistory = await productModel.getBidHistory(productId);
    if (bidHistory?.data) {
      for (const bid of bidHistory.data) {
        const bidder = await userModel.findUserById(bid.bidder_id);
        if (bidder?.email) recipients.add(bidder.email);
      }
    }

    console.log("Recipients:", recipients);

    for (const email of recipients) {
      await transporter.sendMail({
        from: adminGmail,
        to: email,
        subject: `💬 Người bán đã trả lời câu hỏi`,
        text: `${seller.full_name} đã trả lời câu hỏi của bạn`,
        html: `
          <p><b>${seller.full_name}</b> đã trả lời:</p>
          <p><i>${question.question_text}</i></p>
          <p><b>${question.answer[0].answer_text}</b></p>
          <a href="${productLink}">Xem chi tiết</a>
        `,
      });
    }

    await emailLogModel.logEmail(
      productId,
      "answer_posted",
      Array.from(recipients)
    );

    console.log("sent");
  } catch (err) {
    console.error("sendAnswerPostedEmails error:", err);
  }
}


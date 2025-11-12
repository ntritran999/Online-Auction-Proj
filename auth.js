// const passport = require('passport')
// const GoogleStrategy = require('passport-google-oauth2').Strategy;
import passport from "passport";
import GoogleStrategy from "passport-google-oauth2";
import LocalStrategy from "passport-local";
import supabase from "./supabaseClient.js";
import bcrypt from "bcrypt";


// google method
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/google/callback",
    passReqToCallback: true
  },
  (request, accessToken, refreshToken, profile, done) => {
  if (!profile || !profile.id) {
    return done(null, false);
  }

  console.log("Pass - profile.id:", profile.id);
      supabase.from('users')
        .select('*')
        .eq('password_hash', profile.id)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            return supabase.from('users')
              .insert([
                {
                  full_name: profile.displayName,
                  email: profile.emails?.[0]?.value,
                  password_hash: profile.id,
                },
              ])
              .select()  
              .single()  
              .then(({ data: newUserData, error: insertError }) => {
                if (insertError) {
                  return done(insertError, null);
                }
                console.log("add",newUserData);
                return done(null, newUserData);
              });
          }
          // Nếu tìm thấy người dùng, trả về dữ liệu
          return done(null, data);
        })
        .catch(err => done(err, null));
    }

));

passport.serializeUser((user, done) =>{
    done(null, user.email);
});

passport.deserializeUser((email, done) =>{
    supabase.from('users')
    .select('*')
    .eq('email', email)
    .single()
    .then(({ data }) => done(null, data))
    .catch(err => done(err, null));
});

// local method
passport.use(new LocalStrategy(
  {
    usernameField: "email",    
    passwordField: "password", 
  },
  (email, password, done) => {
    supabase.from('users')
    .select('*')
    .eq('email', email)
    .single()
    .then(({data, error}) => {
      if(error || !data){
        console.log("Không tìm thấy user:", email);
        return done(null, false, { message: "Email không tồn tại" });
      }

      return bcrypt.compare(password, data.password_hash)
                  .then((isMatch) =>{
                    if(!isMatch){
                      console.log("Sai mật khẩu");
                      return done(null, false, { message: "Sai mật khẩu" });
                    }
                    return done(null, data);
                  });
    })
    .catch(err => done(err, null));
  }
));
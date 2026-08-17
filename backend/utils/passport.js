import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../models/user.model.js";

const configureProvider = (Strategy, name, clientID, clientSecret, callbackURL) => {
  if (!clientID || !clientSecret) return;
  passport.use(name, new Strategy({ clientID, clientSecret, callbackURL }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error(`${name} did not provide an email address`));
      let user = await User.findOne({ email });
      if (!user) user = await User.create({ fullname: profile.displayName || email.split("@")[0], email, role: "learner", authProvider: name, providerId: profile.id });
      done(null, user);
    } catch (error) { done(error); }
  }));
};

configureProvider(GoogleStrategy, "google", process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/v1/user/oauth/google/callback");
configureProvider(GitHubStrategy, "github", process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET, process.env.GITHUB_CALLBACK_URL || "http://localhost:3000/api/v1/user/oauth/github/callback");

export default passport;

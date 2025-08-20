// the app context is a context which hold the function of auth and etc

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
// import axios from "axios";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  sendEmailVerification,
} from "firebase/auth";

import { getDoc, doc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";

import { db, auth } from "@/config/Firebase";
import { toast } from "react-toastify";

const AppContext = createContext(); // creating context

export function UseAppContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signIn(email, password) {
    try {
      const data = await signInWithEmailAndPassword(auth, email, password);
      console.log(data);

      const usersCollection = doc(db, "users/" + data.user.uid);
      let snapshot = await getDoc(usersCollection);
      if (snapshot.exists) {
        const snapshotvalue = snapshot.data();

        if (snapshotvalue.type === "admin") {
          setUser(snapshotvalue);
          return {
            success: true,
            user: snapshotvalue,
          };
        } else {
          if (!data.user.emailVerified) {
            await sendEmailVerification(data.user, {
              url: `${window.location.origin}/login`,
            });
            logOut();
            return {
              success: false,
              message:
                "Your Email Is Not Verified, We have send email verification link to your email address to verify.",
            };
          } else {
            setUser(snapshotvalue);
            return {
              success: true,
              user: snapshotvalue,
            };
          }
        }
      } else {
        logOut();
        return {
          success: false,
          message: "User Data Not Found",
        };
      }
    } catch (e) {
      return {
        success: false,
        message: e?.message || "Internal Server Error",
      };
    }
  }

  async function logOut() {
    return await signOut(auth);
  }

  async function createAccount(customerData) {
    try {
      // 1. Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        customerData.email,
        customerData.password
      );

      const user = userCredential.user;
      const userRef = doc(db, "users", user.uid);

      // 2. Prepare user data
      const userData = {
        email: user.email,
        name: customerData.name,
        uid: user.uid,
        type: customerData.type,
        phone: customerData.phone || "",
        createdAt: new Date().toISOString(),
        isActive: false,
        ...(customerData.type === "institution" && {
          organizationType: customerData.organizationType,
          address: customerData.address || "",
          points: 0,
        }),
      };

      // 3. Save user data to Firestore
      await setDoc(userRef, userData);

      // 4. Send verification email
      await sendEmailVerification(user, {
        url: `${window.location.origin}/verifyemail`,
      });

      // 5. Temporarily store password for auto-login after verification
      // This will be cleared after successful login or after 1 hour
      localStorage.setItem(`tempPassword_${user.email}`, customerData.password);

      // Set a timeout to clear the stored password after 1 hour for security
      setTimeout(() => {
        localStorage.removeItem(`tempPassword_${user.email}`);
      }, 60 * 60 * 1000); // 1 hour

      // 6. Logout user and clear user state
      await signOut(auth);
      setUser(null); // Explicitly clear user state to prevent header from appearing

      return {
        success: true,
        uid: user.uid,
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  }

  async function setResetPasswordLink(email) {
    return sendPasswordResetEmail(auth, email)
      .then(() => {
        return true;
      })
      .catch((error) => {
        // const errorCode = error.code;
        // const errorMessage = error.message;
        return error.message;
        // ..
      });
  }

  async function updateAuthProfile(
    name,
    email,
    phone,
    password,
    address,
    organizationType
  ) {
    try {
      const loggedUser = auth.currentUser;

      if (!password) {
        throw new Error("Old password is required for authentication.");
      }

      // Reauthenticate the user with the old password
      const credential = EmailAuthProvider.credential(
        loggedUser.email,
        password
      );
      await reauthenticateWithCredential(loggedUser, credential);

      // Update email if it has changed
      if (email && email !== loggedUser.email) {
        await updateEmail(loggedUser, email);
      }

      // Update the user document in Firestore
      const userRef = doc(db, "users", loggedUser.uid);

      // Get current user data from Firestore first
      const userDoc = await getDoc(userRef);
      const currentUserData = userDoc.data();

      if (currentUserData?.type === "user") {
        await updateDoc(userRef, {
          email: email || loggedUser.email,
          name: name || currentUserData.name,
          uid: loggedUser.uid,
          type: currentUserData.type,
          phone: phone || currentUserData.phone,
        });
      } else {
        await updateDoc(userRef, {
          email: email || loggedUser.email,
          name: name || currentUserData.name,
          uid: loggedUser.uid,
          type: currentUserData.type,
          phone: phone || currentUserData.phone,
          address: address || currentUserData.address,
          organizationType:
            organizationType || currentUserData.organizationType,
        });
      }

      // Update local state or context
      setUser({
        email: email || loggedUser.email,
        name: name || currentUserData.name,
        uid: loggedUser.uid,
        type: currentUserData.type,
        phone: phone || currentUserData.phone,
      });

      console.log("Profile updated successfully.");
      return {
        success: true,
        message: "Profile Updated Successfully",
      };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: e?.message || "Internal Server Error",
      };
    }
  }

  async function updateAuthPassword(oldpassword, newPassword) {
    try {
      const loggeduser = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        loggeduser.email,
        oldpassword
      );

      // auth.currentUser as first param
      await reauthenticateWithCredential(loggeduser, credential);
      await updatePassword(loggeduser, newPassword);

      return {
        success: true,
        message: "Profile Updated Successfully",
      };
    } catch (e) {
      return {
        success: false,
        message: e?.message || "Internal Server Error",
      };
    }
  }

  const unsubscribe = useCallback(() => {
    setLoading(true);

    const authUnsubscribe = onAuthStateChanged(auth, (currentuser) => {
      if (currentuser) {
        console.log("Auth state changed - user:", currentuser);

        // Only proceed if the user's email is verified (for non-admin users)
        if (
          currentuser.emailVerified ||
          currentuser.email === "admin@gtl.com"
        ) {
          const usersDocRef = doc(db, "users", currentuser.uid);

          const userDocUnsubscribe = onSnapshot(
            usersDocRef,
            (snapshot) => {
              const data = snapshot.data();

              if (data?.uid) {
                setUser(data);
                setLoading(false);
              } else {
                setLoading(false);
                logOut();
              }
            },
            (error) => {
              console.error("Error fetching user doc:", error);
              setLoading(false);
            }
          );

          // Optional: return unsubscribe for user doc snapshot
          return userDocUnsubscribe;
        } else {
          // User is not verified, don't set user state
          console.log("User email not verified, not setting user state");
          setLoading(false);
          setUser(null);
        }
      } else {
        logOut();
        setLoading(false);
        setUser(null);
      }
    });

    // Return auth state unsubscribe handler (optional cleanup)
    return authUnsubscribe;
  }, []);

  useEffect(() => {
    //loading true
    setLoading(true);

    unsubscribe();
  }, [unsubscribe]);

  return (
    <AppContext.Provider
      value={{
        loading,
        user,
        signIn,
        createAccount,
        logOut,
        setResetPasswordLink,
        updateAuthPassword,
        updateAuthProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// export the whole context
export function useAppContext() {
  return useContext(AppContext);
}

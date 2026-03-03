import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { User } from "firebase/auth";

export const trackAppOpen = async (firebaseUser: User) => {
  try {
    if (!firebaseUser) return;

    const docRef = doc(firestore, "userAppVisits", firebaseUser.uid);
    const docSnap = await getDoc(docRef);

    const now = new Date();

    // 🔹 First time opening app ever
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        dailyAppOpenCount: 1,
        firstOpenTime: now,   // marks start of 24h window
        lastVisit: now,
        updatedAt: now,
      });

      console.log("First app visit recorded");
      return;
    }

    const data = docSnap.data();
    const firstOpenTime = data.firstOpenTime?.toDate?.() || null;
    const currentCount = data.dailyAppOpenCount || 0;

    if (!firstOpenTime) {
      // If something missing, reset safely
      await updateDoc(docRef, {
        dailyAppOpenCount: 1,
        firstOpenTime: now,
        lastVisit: now,
        updatedAt: now,
      });
      return;
    }

    const diffHours =
      (now.getTime() - firstOpenTime.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      //Still inside same 24h window → increment
      await updateDoc(docRef, {
        dailyAppOpenCount: currentCount + 1,
        lastVisit: now,
        updatedAt: now,
      });

      console.log("Visit counted within same 24h window");
    } else {
      // 24h passed → reset counter
      await updateDoc(docRef, {
        dailyAppOpenCount: 1,
        firstOpenTime: now,
        lastVisit: now,
        updatedAt: now,
      });

      console.log("24h window expired → counter reset");
    }

  } catch (error) {
    console.log("App visit tracking error:", error);
  }
};
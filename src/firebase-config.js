import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "@firebase/firestore";
import {getAuth} from  "@firebase/auth";
import {getStorage} from "@firebase/storage"

const firebaseConfig = {
    apiKey: "AIzaSyB7jyFg3oFpbNvQPxNfsofPxjJe--ULhV8",
    authDomain: "mouth-drawing.firebaseapp.com",
    projectId: "mouth-drawing",
    storageBucket: "mouth-drawing.appspot.com",
    messagingSenderId: "24393441437",
    appId: "1:24393441437:web:518c97106c328a9691f474",
    measurementId: "G-G5G10CC73K"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app)
export const auth = getAuth(app);
export const storage = getStorage(app)

import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "@firebase/auth";
import { getDoc, doc } from "@firebase/firestore";
import { auth, db } from "./firebase-config";
import {
  RouterProvider,
  Route,
  Routes,
  redirect,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Drawing from "./pages/Drawing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import User from "./pages/User";
import Error from "./components/Error";
import Header from "./components/Header";
import Loading from "./components/Loading";

export const Authcontext = createContext("");

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  const getusername = async () => {
    const name = (await getDoc(doc(db, "user", user.uid))).data().username;
    setUsername(name);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (res) => {
      setLoading(true);
      if (res) {
        setUser(res);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      getusername();
    }
  }, [user]);

  const requireAuth = async () => {
    if (!user) {
      throw redirect("/login");
    }

    return null;
  };

  const requireUnAuth = async () => {
    if (user) {
      throw redirect("/");
    }

    return null;
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        <Route path="/" element={<Header username={username} />}>
          {/* art */}
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} loader={requireUnAuth} />
          <Route
            path="register"
            element={<Register />}
            loader={requireUnAuth}
          />
          <Route path="user/:username" element={<User />} />
          <Route path="*" element={<Error />} />
        </Route>
        <Route path="/drawing" element={<Drawing />} loader={requireAuth} />
      </Route>
    )
  );

  return (
    <Authcontext.Provider value={{ user }}>
      {!loading ? (
        <RouterProvider router={router} />
      ) : (
        <div className="w-screen h-screen">
          <Loading />
        </div>
      )}
    </Authcontext.Provider>
  );
}

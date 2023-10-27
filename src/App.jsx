import React, { createContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from "@firebase/auth"
import { auth, db } from "./firebase-config"
import { RouterProvider, Route, Routes, redirect, createBrowserRouter, createRoutesFromElements } from "react-router-dom";
import Drawing from './pages/Drawing';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import User from './pages/User';
import Error from './components/Error';
import Header from './components/Header';
import Loading from './components/Loading';


export const Authcontext = createContext("")

export default function App() {

  const [user, setUser] = useState()
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    onAuthStateChanged(auth,(res) => {
      setLoading(true)
      if (res) {
        setUser(res);
        setLoading(false)
      } else {
        setUser();
        setLoading(false)
      }
    });
  
  }, [])

  const requireAuth = async () => {
    if (!user){
      throw redirect("/login")
    }

    return null
  };

  
  const requireUnAuth = async () => {
    if (user){
      throw redirect("/")
    }

    return null
  };

  const router = createBrowserRouter(createRoutesFromElements(
    <Route>
      <Route path='/'  element={<Header/>}>
      {/* art */}
      <Route index element={<Home />}/>
      <Route path='login' element={<Login/>}  loader={requireUnAuth}/>
      <Route path='register' element={<Register/>}  loader={requireUnAuth}/>
      <Route path='user/:username' element={<User/>} />
      <Route path='*' element={<Error />}/>
    </Route>
    <Route path='/drawing' element={<Drawing/>}  loader={requireAuth}/>
    </Route>
  ))

  return (
    <Authcontext.Provider value={{user}}>
      {!loading?<RouterProvider router={router} />:<div className='w-screen h-screen'><Loading /></div>}
    </Authcontext.Provider>
  )
}

import React, { useState, useEffect, useContext } from 'react'
import { Authcontext } from '../App'
import { auth, db, storage } from '../firebase-config'
import { getDoc, getDocs, query, where, doc, collection, orderBy, updateDoc, arrayUnion, arrayRemove, limit, startAfter } from '@firebase/firestore'
import { getDownloadURL, ref } from '@firebase/storage'
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai'
import Loading from '../components/Loading'
import { Link } from 'react-router-dom'


export default function Home() {

  //getuserdata
  const { user } = useContext(Authcontext)
  const [imgList, setImgList] = useState([])
  const [ordertype, setOderType] = useState("Recently")
  const [currentImg, setCurrentImg] = useState()
  const [imgLoading, setimgLoading] = useState(true)

  // get img data
  const getdata = async () => {
    setImgList([])
    setimgLoading(true)
    let querySnapshot
    if (ordertype == "Recently") {
      querySnapshot = await getDocs(query(collection(db, "img"),
        where("post", "==", true),
        orderBy("timestamp", "desc"),
        limit(10)))
    } else if (ordertype == "Popular") {
      querySnapshot = await getDocs(query(collection(db, "img"),
        where("post", "==", true),
        orderBy("like", "desc"),
        orderBy("timestamp", "desc"),
        limit(10)))
    }

    if (querySnapshot) {
      const allimg = await Promise.all(querySnapshot.docs.map(async (img) => {
        const url = await getDownloadURL((ref(storage, img.id)))
        const imgdata = img.data()
        imgdata.owner = (await getDoc(doc(db, "user", imgdata.userId))).data().username
        imgdata.url = url

        const imgobj = { id: img.id, data: imgdata }
        return imgobj
      }))

      setImgList(allimg)
      setimgLoading(false)

    }
  }


  useEffect(() => {

    getdata()

    return () => {
      setImgList()
    }

  }, [ordertype])

  const like = async (imgId) => {

    const imgIndex = imgList.findIndex(img => img.id === imgId)
    const img = imgList[imgIndex]
    const userLike = img.data.userLike
    const like = img.data.like

    if (user) {
      // toggle like
      if (userLike.includes(user.uid)) {


        await updateDoc(doc(db, "img", imgId), {
          userLike: arrayRemove(user.uid),
          like: like - 1
        })

        const newImgList = [...imgList]
        newImgList[imgIndex].data.userLike = userLike.filter(uid => uid !== user.uid);
        setImgList(newImgList)
        // unlike


      } else {

        // like
        await updateDoc(doc(db, "img", imgId), {
          userLike: arrayUnion(user.uid),
          like: like + 1
        })
        
        // add like user.id
        const newImgList = [...imgList]
        newImgList[imgIndex].data.userLike.push(user.uid)
        setImgList(newImgList)

      }
    }
  }

  const clickimg = (imgUrl) => {
    setCurrentImg(imgUrl)
    document.getElementById('my_modal_2').showModal()
  }

  const getMoreData = async () => {
    setimgLoading(true)
    let querySnapshot
    if (ordertype == "Recently") {
      querySnapshot = await getDocs(query(collection(db, "img"),
        where("post", "==", true),
        orderBy("timestamp", "desc"),
        startAfter(imgList[imgList.length - 1].data.timestamp),
        limit(10)))
    } else if (ordertype == "Popular") {
      querySnapshot = await getDocs(query(collection(db, "img"),
        where("post", "==", true),
        orderBy("like", "desc"),
        orderBy("timestamp", "desc"),
        startAfter(imgList[imgList.length - 1].data.like, imgList[imgList.length - 1].data.timestamp),
        limit(10)))
    }

    if (querySnapshot) {
      const allimg = await Promise.all(querySnapshot.docs.map(async (img) => {
        const url = await getDownloadURL((ref(storage, img.id)))
        const imgdata = img.data()
        imgdata.owner = (await getDoc(doc(db, "user", imgdata.userId))).data().username
        imgdata.url = url

        const imgobj = { id: img.id, data: imgdata }
        return imgobj
      }))



      const newImgList = [...imgList, ...allimg]
      setImgList(newImgList)
      setimgLoading(false)
    }
  }



  return (
    <section>

      {/* hero */}
      <div className='hero min-h-[50vh] bg-gray-100 shadow-inner	'>
        <div className='flex flex-col justify-center items-start px-[5vw] w-full h-full'>
          <h6 className=" font-bold  font-KAUFMANN">
            this not meme draw this mouth draw
          </h6>
        </div>
      </div>

      {/* img */}
      <section className="bg-white rounded-2xl -translate-y-4 px-[5vw]">
        {/* nav */}
        <div className="container py-10 mx-auto">

          <div className="flex w-full max-w-[30rem] ">
            <button className={`type-btn ${ordertype === "Recently" ? "text-black" : "text-gray-300"}`}
              onClick={() => { setOderType("Recently") }}>Recently</button>
            <button className={`type-btn mx-[8%] ${ordertype === "Popular" ? "text-black" : "text-gray-300"}`}
              onClick={() => { setOderType("Popular") }}>Popular</button>
          </div>

          {/* img container */}
          <div className="grid grid-cols-1 gap-8 mt-20 xs:grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:grid-cols-3 ">

            {/* img element */}

            {imgList.length != 0 &&
              imgList.map((img) => {
                return <div key={img.id} className='h-96 overflow-hidden rounded-2xl shadow-[rgba(50,_50,_105,_0.10)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.025)_0px_1px_1px_0px]'>
                  {/* img */}
                  <div class="w-full h-[82%]">
                    <img src={img.data.url} className='object-cover h-full w-full' onClick={() => { clickimg(img.data.url) }} />

                  </div>
                  {/* desc section */}
                  <div className='flex px-5 py-5 w-full justify-between items-center '>
                    <div className=''>
                      <Link to={`user/${img.data.owner}`}>{img.data.owner}</Link>
                    </div>

                    <div className='flex justify-center items-center '>
                      <p className='px-3'>{img.data.userLike.length}</p>
                      <button onClick={() => { like(img.id) }}>
                        {user ? img.data.userLike.includes(user.uid) ? <AiFillHeart /> : <AiOutlineHeart /> : <AiOutlineHeart className='text-gray-300' />}
                      </button>
                    </div>
                  </div>

                </div>
              })

            }

          </div>


        </div>
      </section>

      {!imgLoading ?
        <div className='flex justify-center my-9'>
          <button className='border border-gray-500 text-gray-500 text-center p-2 px-5 rounded-xl hover:bg-black hover:text-white hover:border-none transition-all duration-200 ease-in'
            onClick={getMoreData}
          >Load more img
          </button>
        </div>
        : <div className='my-9'><Loading /></div>}


      <dialog id="my_modal_2" className="modal">
        <div className="modal-box shadow-[rgba(50,_50,_105,_0.10)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.025)_0px_1px_1px_0px]">
          <img src={currentImg} alt="" />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>


    </section>
  )
}

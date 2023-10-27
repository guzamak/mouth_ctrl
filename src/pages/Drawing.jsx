import React, { useEffect, useRef, useState, useCallback, useContext } from 'react'
import { Authcontext } from '../App';
import * as tf from '@tensorflow/tfjs'
import * as blazeface from '@tensorflow-models/blazeface'
import { storage, db } from '../firebase-config';
import { setDoc, doc, addDoc, collection, serverTimestamp } from '@firebase/firestore'
import { ref, uploadString } from "@firebase/storage";
import { v4 as uuidv4 } from 'uuid';
import { RiEdit2Line, RiEraserLine, RiDeleteBin6Line, RiArrowGoBackLine, RiArrowGoForwardFill, RiInstallLine, RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { BsPlusSquareFill } from 'react-icons/bs'
import { AiOutlineCheck } from 'react-icons/ai'

export default function Drawing() {

  const scrollableDiv = useRef();
  const bglayer = useRef();
  const drawlayer = useRef();
  const mergeCanvas = useRef();
  const webcam = useRef();
  const trackingdiv = useRef();
  const savePopUp = useRef();

  const [contentScale, setContentScale] = useState(1)
  const [isDraw, setIsDraw] = useState(false)
  const [ctx, setctx] = useState({
    bg: null, //bglayer
    draw: null, // layer1
  })
  const [model, setModel] = useState()
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  const [canvasState, setCanvasState] = useState({
    eraser: false,
    brushsize: 10,
    color: null,
    initialScale: 1,
  })

  const [viewportState, setViewportState] = useState({
    startX: null,
    startY: null,
    startScrollLeft: null,
    startScrollTop: null,
    isMouseDown: false,
    isTouching: false,
    initialDistance: null
  })
  const [colorNum,setColorNum] = useState(0)
  const [createError,setCreateError] = useState()

  const { user } = useContext(Authcontext)

  let smoothedX = null;
  let smoothedY = null;
  let smoothingFactor = 0.8

  const smoothCoordinate = useCallback((x, y) => {

    if (smoothedX === null || smoothedY === null) {
      smoothedX = x;
      smoothedY = y;
    } else {
      smoothedX = smoothingFactor * smoothedX + (1 - smoothingFactor) * x;
      smoothedY = smoothingFactor * smoothedY + (1 - smoothingFactor) * y;
    }
    return { x: smoothedX, y: smoothedY };
  }, [])


  const drawLine = useCallback((x, y) => {
    !canvasState.eraser ? ctx.draw.globalCompositeOperation = 'source-over' : ctx.draw.globalCompositeOperation = 'destination-out'
    ctx.draw.lineWidth = canvasState.brushsize
    ctx.draw.strokeStyle = canvasState.color;
    ctx.draw.lineCap = 'round'
    ctx.draw.lineTo(x, y);
    ctx.draw.stroke();
    ctx.draw.beginPath();
    ctx.draw.moveTo(x, y);
    ctx.draw.globalCompositeOperation = 'source-over' //change mode before save 
    setUndoStack([...undoStack,drawlayer.current.toDataURL()])
    setRedoStack([])
  }, [ctx, canvasState, undoStack])

  const onDraw = useCallback(() => {
    setIsDraw(true)
  }, [undoStack])

  const unDraw = useCallback(() => {
    setIsDraw(false)
  }, [])

  //paning and zoom
  const handleMouseDown = useCallback((e) => {
    setViewportState({
      ...viewportState,
      startX: e.pageX - scrollableDiv.current.offsetLeft,
      startY: e.pageY - scrollableDiv.current.offsetTop,
      startScrollLeft: scrollableDiv.current.scrollLeft,
      startScrollTop: scrollableDiv.current.scrollTop,
      isMouseDown: true,
    })
  }, [viewportState])

  const handleMouseUp = useCallback((e) => {
    setViewportState({
      ...viewportState,
      isMouseDown: false,
    })
  }, [viewportState])

  const handleMouseMove = useCallback((e) => {
    e.preventDefault();
    if (viewportState.isMouseDown && !isDraw) {
      const x = e.pageX - scrollableDiv.current.offsetLeft;//endx
      const y = e.pageY - scrollableDiv.current.offsetTop;
      const walkX = (x - viewportState.startX) * 0.5; // value(startx-endx) * speed
      const walkY = (y - viewportState.startY) * 0.5;
      scrollableDiv.current.scrollLeft = viewportState.startScrollLeft - walkX;
      scrollableDiv.current.scrollTop = viewportState.startScrollTop - walkY;
    }
  }, [isDraw, viewportState])

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey && !isDraw && ctx.draw) {
      const currentZoom = contentScale;
      const zoomFactor = 1 + e.deltaY * 0.001;

      const newZoom = Math.round(Math.min(Math.max(currentZoom * zoomFactor, 0.1), 5) * 100) / 100;
      setContentScale(newZoom);
    }
  }, [isDraw, contentScale, ctx])


  // //zoom in phone

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setViewportState({
        ...viewportState,
        touchStartX: e.touches[0].pageX,
        touchStartY: e.touches[0].pageY,
        startScrollLeft: scrollableDiv.current.scrollLeft,
        startScrollTop: scrollableDiv.current.scrollTop,
        isTouching: true,
      });
    }
    if (e.touches.length === 2) {
      setViewportState({
        ...viewportState,
        initialDistance: Math.hypot(e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY)
      })
    }
  }, [viewportState])

  const handleTouchMove = useCallback((e) => {
    if (viewportState.isTouching && !isDraw) {
      const touch = e.touches[0];
      const deltaX = touch.pageX - viewportState.touchStartX;
      const deltaY = touch.pageY - viewportState.touchStartY;
      const newScrollLeft = viewportState.startScrollLeft - deltaX;
      const newScrollTop = viewportState.startScrollTop - deltaY;
      scrollableDiv.current.scrollLeft = newScrollLeft;
      scrollableDiv.current.scrollTop = newScrollTop;
    }

    if (e.touches.length === 2 && ctx.draw && !isDraw) {
      const currentDistance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const currentZoom = contentScale;
      const zoomFactor = (currentDistance / viewportState.initialDistance) ** 0.05;
      const newZoom = Math.round(Math.min(Math.max(currentZoom * zoomFactor, 0.1), 2) * 100) / 100;
      setContentScale(newZoom);

    }
  }, [viewportState, contentScale, ctx, isDraw])

  const handleTouchEnd = useCallback((e) => {
    setViewportState({
      ...viewportState,
      initialDistance: null,
      isTouching: false,
    })
  }, [viewportState])


  //undo redo

  const undo = useCallback(() => {
    if (undoStack.length > 1 && ctx.draw) {
      const newUndo = [...undoStack];
      const lastUndo = newUndo.pop();
      setUndoStack(newUndo);
      setRedoStack([...redoStack, lastUndo]);
      const img = new Image();
      img.src = newUndo[newUndo.length - 1]
      img.onload = () => {
        ctx.draw.clearRect(0, 0, drawlayer.current.width, drawlayer.current.height);
        ctx.draw.drawImage(img, 0, 0);
      }
    }
  }, [ctx, undoStack, redoStack])

  const redo = useCallback(() => {
    if (redoStack.length > 0 && ctx.draw) {
      const newRedo = [...redoStack];
      const lastRedo = newRedo.pop();
      setRedoStack(newRedo);
      setUndoStack([...undoStack, lastRedo]);
      const img = new Image();
      img.src = lastRedo;
      img.onload = () => {
        ctx.draw.clearRect(0, 0, drawlayer.current.width, drawlayer.current.height);
        ctx.draw.drawImage(img, 0, 0);
      };
    }
  }, [ctx, undoStack, redoStack])

  const pencil = useCallback(() => {
    setCanvasState({
      ...canvasState,
      eraser: false
    })
  }, [canvasState])

  const eraser = useCallback(() => {
    setCanvasState({
      ...canvasState,
      eraser: true
    })
  }, [canvasState])

  const clean = useCallback(() => {
    if (ctx && !isDraw) {
      ctx.draw.clearRect(0, 0, drawlayer.current.width, drawlayer.current.height);
      ctx.bg.clearRect(0, 0, drawlayer.current.width, drawlayer.current.height);
      setUndoStack([drawlayer.current.toDataURL()])
      setRedoStack([])
      setctx({
        bg: null,
        draw: null
      })
    }
  }, [ctx, isDraw])


  const changeBrushSize = useCallback((e) => {
    setCanvasState({
      ...canvasState,
      brushsize: e.target.value
    })
  }, [canvasState])

  const changeBrushColor = useCallback((e) => {

    setCanvasState({
      ...canvasState,
      color: e.target.attributes.color.nodeValue
    })
  }, [canvasState])

  const resizeCanvas = useCallback(() => {

    const canvasWidth = bglayer.current.width;
    const canvasHeight = bglayer.current.height;
    const viewportWidth = scrollableDiv.current.offsetWidth;
    const viewportHeight = scrollableDiv.current.offsetHeight;

    const scaleX = viewportWidth / (canvasWidth + ((canvasWidth / 100) * 20));
    const scaleY = viewportHeight / (canvasHeight + ((canvasHeight / 100) * 20));


    setCanvasState({
      ...canvasState,
      initialScale: Math.min(scaleX, scaleY),
    })
    setIsDraw(false)

  }, [canvasState])

  const resizeWebcam = useCallback(() => {
    const widthInPer = Math.round(((scrollableDiv.current.offsetWidth / window.innerWidth) / 2) * 100)
    const heightInPer = Math.round(((scrollableDiv.current.offsetHeight / window.innerHeight) / 2) * 100)
    webcam.current.parentNode.style.left = `${widthInPer}%`
    webcam.current.parentNode.style.top = `${heightInPer}%`
  }, [scrollableDiv])


  const createCanvas = (e) => {
    e.preventDefault()
    if (!ctx.bg && !ctx.draw) {
      scrollableDiv.current.scrollTo(0,0)
      // string
      const width = e.target.width.value
      const height = e.target.height.value

      if (!isNaN(width) && !isNaN(height) && width != "" && height != "") {
        document.getElementById('my_modal_1').close()
      bglayer.current.width = width
      bglayer.current.height = height

      drawlayer.current.width = width
      drawlayer.current.height = height

      const bgctx = bglayer.current.getContext('2d')
      const drawctx = drawlayer.current.getContext('2d')
      setctx({
        draw: drawctx,
        bg: bgctx
      })
      bgctx.fillStyle = "white";
      bgctx.fillRect(0, 0, bglayer.current.width, bglayer.current.height);
      drawctx.clearRect(0, 0, bglayer.current.width, bglayer.current.height);
      setUndoStack([...undoStack, drawlayer.current.toDataURL()])

      const canvasRect = bglayer.current.getBoundingClientRect();
      scrollableDiv.current.scrollTo(
        canvasRect.left - ((scrollableDiv.current.offsetWidth - canvasRect.width) / 2),
        canvasRect.top - ((scrollableDiv.current.offsetHeight - canvasRect.height) / 2)
      );
     }else {
      setCreateError("please enter numbers only")
     }
      

        
      resizeCanvas()


    }
  }

  const saveImg = useCallback(() => {

    if (ctx.bg && ctx.draw && !isDraw) {
      mergeCanvas.current.width = bglayer.current.width
      mergeCanvas.current.height = bglayer.current.height
      const mergectx = mergeCanvas.current.getContext('2d')
      mergectx.drawImage(bglayer.current, 0, 0);
      mergectx.drawImage(drawlayer.current, 0, 0);
      const mergedDataURL = mergeCanvas.current.toDataURL();
      const imgName = uuidv4()
      const storageRef = ref(storage, imgName);
      uploadString(storageRef, mergedDataURL, 'data_url').then((snapshot) => {
        setDoc(doc(db, "img", `${imgName}`), {
          userId: user.uid,
          like: 0,
          post: false,
          userLike: [],
          timestamp: serverTimestamp()
        })
        savePopUp.current.classList.add("opacity-100")
        setTimeout(() => { savePopUp.current.classList.remove("opacity-100") }, 1000)
      });
    }
  }, [ctx, isDraw])


  //start and end draw undo
  useEffect(() => {
    const keydown = (e) => {
      if (e.code === 'Space') {
        onDraw()
        e.preventDefault()
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        redo()
        e.preventDefault()
      }
      else if (e.ctrlKey && e.key === 'z') {
        undo()
        e.preventDefault()
      }

    }

    const keyup = (e) => {

      if (e.code === 'Space') {
        unDraw()
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', keydown, { passive: false });
    document.addEventListener('keyup', keyup, { passive: false });

    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('keyup', keyup)
    }
  }, [ctx, undoStack, redoStack])

  //resize screen
  useEffect(() => {

    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("resize", resizeWebcam)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }

  }, [canvasState])

  //deteced face
  useEffect(() => {
    if (model) {
      const detectFaces = async () => {

        const prediction = await model.estimateFaces(webcam.current, false);
        // console.log(prediction)
        if (prediction[0] && ctx.bg && ctx.draw) {
          if (prediction[0].probability[0]) {
            // getx,y
            const x = prediction[0].landmarks[3][0]
            const y = prediction[0].landmarks[3][1]
            // get canvas and webcam position
            const webcamRect = webcam.current.getBoundingClientRect();
            const webcamX = webcamRect.left
            const webcamY = webcamRect.top
            const canvasRect = bglayer.current.getBoundingClientRect();
            const canvasX = canvasRect.left
            const canvasY = canvasRect.top
            const vedioScaleX = webcam.current.videoWidth / webcamRect.width
            const vedioScaleY = webcam.current.videoHeight / webcamRect.height
            // smooth x,y
            const smoothPosition = smoothCoordinate(x, y);
            //change trackingdiv x,y
            trackingdiv.current.style.left = smoothPosition.x / vedioScaleX + 'px'
            trackingdiv.current.style.top = smoothPosition.y / vedioScaleY + 'px'
            // draw 
            if (isDraw) {
              drawLine(((webcamX - canvasX) + (smoothPosition.x / vedioScaleX)) / (contentScale * canvasState.initialScale),
                ((webcamY - canvasY) + (smoothPosition.y / vedioScaleY)) / (contentScale * canvasState.initialScale))
            } else {
              ctx.draw.beginPath();
            }
          }
        }
      }
      const interval = setInterval(() => {
        detectFaces()
      }, 100);

      return () => {
        clearInterval(interval);
      };
    }

  }, [ctx, model, isDraw, contentScale])

  useEffect(() => {
    let mediastream;
    const handleWheel = (e) => {
      e.preventDefault();
    };
  
    const handleMouseDown = (e) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };
  
    const handleTouchMove = (e) => {
      e.preventDefault();
    };
  
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('mousedown', handleMouseDown, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
  
    const cleanup = () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchmove', handleTouchMove);
      if (mediastream){
        mediastream.getTracks().forEach(track => track.stop());
      }
    };
  
      const setupCamera = () => {
        navigator.mediaDevices.getUserMedia({
          video: {},
          audio: false,
        })
        .then((stream) => {
          webcam.current.srcObject = stream;
          mediastream = stream
        });
      };
    
      setupCamera();
    
      webcam.current.addEventListener("loadeddata", async () => {
        const model = await blazeface.load();
        setModel(model);
      });
    
      resizeWebcam();
  
    return cleanup;
  }, [webcam]);
  
  const colorUp = () => {
      colorNum > 0 &&setColorNum(colorNum-1)
  }
  const colorDown = () => {
      colorNum < 8 &&setColorNum(colorNum+1)
  }




  return (
    <div className='h-screen w-screen overflow-hidden flex'>
      {/* artboard */}
      <div ref={scrollableDiv} className='overflow-scroll h-[100vh] w-[100vw] '>
        {/* content */}
        <div
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          onWheel={handleWheel}
          className="min-w-[350vw] min-h-[350vh] bg-gray-200 relative touch-none touch-pan-x touch-pan-y flex justify-center items-center"
        >
          <canvas ref={bglayer} style={{ transform: `scale(${contentScale * canvasState.initialScale})` }}
            className={`pointer-events-none absolute shadow-[rgba(50,_50,_105,_0.10)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.025)_0px_1px_1px_0px] ${!ctx.bg && "invisible"}`}>
          </canvas>
          <canvas ref={drawlayer} style={{ transform: `scale(${contentScale * canvasState.initialScale})` }}
            className={`pointer-events-none absolute ${!ctx.draw && "invisible"}`}></canvas>
          <canvas ref={mergeCanvas} className='hidden'></canvas>
        </div>
        {/* webcam */}
        <div className={`fixed transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 ${!ctx.draw && "hidden"}`}>
          <video ref={webcam} className='opacity-20 h-full w-full' autoPlay ></video>
          <div className='border-solid border-gray-500 border-2  absolute rounded-full -translate-y-1/2 -translate-x-1/2'
            style={{ width: `${canvasState.brushsize * contentScale * canvasState.initialScale}px`, height: `${canvasState.brushsize * contentScale * canvasState.initialScale}px`, }}
            ref={trackingdiv}></div>
        </div>

        <div className={`fixed top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 ${ctx.bg && "hidden"} `}>
          <BsPlusSquareFill className='w-[45vmin] h-[45vmin] text-gray-300' onClick={() => document.getElementById('my_modal_1').showModal()} />
          <div className='text-gray-600 mt-2 justify-center items-center'>
            <p className='flex text-xs'>click <BsPlusSquareFill /> to create canvas </p>
            <p className='flex text-xs'>move mouth and press spacebar or torch <RiEdit2Line /> in phone  to draw</p>
          </div>
        </div>
      </div>

      {/* toolbox */}


      {/* create canvas modal */}
      <dialog id="my_modal_1" className="modal">
        <div className="modal-box shadow-[rgba(50,_50,_105,_0.10)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.025)_0px_1px_1px_0px]">
          <p className="py-2">Create canvas</p>
          <div className="modal-action justify-start">
            <form method="dialog" className='w-full' onSubmit={createCanvas} >

              <div className="mb-3">
                <label className="mb-2 block text-xs font-semibold">Width</label>
                <input
                  id="width"
                  type="text"
                  defaultValue="1980"
                  className="block w-full rounded-md border border-secondary-400 focus:outline-none focus:ring-1 focus:ring-secondary-100 py-1 px-1.5 text-secondary-300" />
              </div>

              <div className="mb-3">
                <label className="mb-2 block text-xs font-semibold">Height</label>
                <input
                  id="height"
                  type="text"
                  defaultValue="1980"
                  className="block w-full rounded-md border border-secondary-400 focus:outline-none focus:ring-1 focus:ring-secondary-100 py-1 px-1.5 text-secondary-300" />
              </div>

              <p className='text-xs text-red-400 py-1'>{createError}</p>
              <div className="mb-3 ">
                <button type='submit'
                  className="btn mb-1.5 w-full text-center text-secondary-200 hover:bg-secondary-100 px-1 rounded-md"
                >Create</button>
              </div>
            </form>
          </div>
        </div>
      </dialog>

      {/* draw in phone */}
      <div className=' fixed p-4  rounded-full left-1/2 -translate-x-1/2 bottom-10 md:hidden bg-black bg-opacity-10 text-gray-700'
        onTouchStart={onDraw}
        onTouchEnd={unDraw} 
        onMouseDown={onDraw}
        onMouseUp={unDraw}
        onMouseLeave={unDraw}>
        <RiEdit2Line />
      </div>

      <div className='py-8 px-[5vw] fixed flex justify-between w-full space-x-[1vw]'>


        <div className='flex space-x-[1vw]'>
          <div className='flex space-x-[1vw] '>
            <div className="flex justify-center items-center">
              <RiArrowGoBackLine onClick={undo} className={`${undoStack.length <= 1 && "text-gray-400"}`} />
            </div>
            <div className="flex justify-center items-center">
              <RiArrowGoForwardFill onClick={redo} className={`${redoStack.length == 0 && "text-gray-400"}`} />
            </div>
          </div>

          <div className={`bg-black bg-opacity-10 p-2 rounded-xl cursor-pointer text-gray-700 transition-all duration-200 ${!canvasState.eraser ? "opacity-100" : "opacity-50"}`} onClick={pencil}>
            <RiEdit2Line />
          </div>

          <div className={`bg-black bg-opacity-10 p-2 rounded-xl cursor-pointer text-gray-700 transition-all duration-200 ${canvasState.eraser ? "opacity-100" : "opacity-50"}`} onClick={eraser}>
            <RiEraserLine />
          </div>

          <div className='flex w-[50%] items-center justify-center bg-black bg-opacity-10 opacity-70  p-2 rounded-xl text-gray-700 min-w-[5rem] '>
            <div className='flex w-full'>
              <input type="range" className="bush-size w-full mx-[0.5vw]" onChange={changeBrushSize} min={1} max={100} defaultValue={canvasState.brushsize} />
            </div>

            <div className='w-full h-[0.875rem] overflow-hidden flex flex-row '>
              <div className="h-full w-[90%]" style={{ transform: `translateY(-${colorNum * 0.875}rem)` }}>
                <div className={`h-full w-full rounded-md bg-[#ffffff] ${canvasState.color == "#ffffff" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#ffffff'></div>
                <div className={`h-full w-full rounded-md bg-[#d73a49] ${canvasState.color == "#d73a49" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#d73a49'></div>
                <div className={`h-full w-full rounded-md bg-[#f66a0a] ${canvasState.color == "#f66a0a" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#f66a0a'></div>
                <div className={`h-full w-full rounded-md bg-[#ffd33d] ${canvasState.color == "#ffd33d" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#ffd33d'></div>
                <div className={`h-full w-full rounded-md bg-[#6f42c1] ${canvasState.color == "#6f42c1" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#6f42c1'></div>
                <div className={`h-full w-full rounded-md bg-[#28a745] ${canvasState.color == "#28a745" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#28a745'></div>
                <div className={`h-full w-full rounded-md bg-[#0366d6] ${canvasState.color == "#0366d6" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#0366d6'></div>
                <div className={`h-full w-full rounded-md bg-[#6a737d] ${canvasState.color == "#6a737d" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#6a737d'></div>
                <div className={`h-full w-full rounded-md bg-[#000000] ${canvasState.color == "#000000" ? "opacity-100" : "opacity-50"}`} onClick={changeBrushColor} color='#000000'></div>
              </div>

              <div className='ml-[1%]'>
                < RiArrowUpSLine className='text-[50%] ' onClick={colorUp}/>
                < RiArrowDownSLine className='text-[50%]'  onClick={colorDown}/>
              </div>
            </div>

          </div>
        </div>




        <div className='flex items-center space-x-[1vw]'>
          <div className='bg-black bg-opacity-10  p-2 cursor-pointer rounded-xl text-gray-700 transition-all duration-200 opacity-50 hover:opacity-100' onClick={clean}>
            <RiDeleteBin6Line />
          </div>
          <div className='bg-black bg-opacity-10 p-2 cursor-pointer rounded-xl text-gray-700 transition-all duration-200 opacity-50 hover:opacity-100' onClick={saveImg}>
            <RiInstallLine />
          </div>
        </div>
      </div>

      {/* when save compelete */}
      <div className='fixed flex text-green-800 bg-green-200 bg-opacity-90 p-6 w-screen pointer-events-none opacity-0 ransition-all duration-300' ref={savePopUp}>
        <p>save compeleted</p>
        <AiOutlineCheck />
      </div>

    </div >

  )
}

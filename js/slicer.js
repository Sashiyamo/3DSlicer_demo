// import * as THREE from 'three';
// import { OrbitControls } from 'https://unpkg.com/three@0.139.0/examples/jsm/controls/OrbitControls.js';
// import { GUI } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/lil-gui.module.min.js';
// import { STLLoader } from 'https://unpkg.com/three@0.139.0/examples/jsm/loaders/STLLoader.js'
// import JSZip from '../node_modules/jszip/dist/jszip.min.js';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import JSZip from 'jszip';
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import firebase from "firebase/compat";
import "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBCFFWH2IxyvhRGDCiC1js8wBm-spRKiqk",
    authDomain: "tdslicer-a2802.firebaseapp.com",
    projectId: "tdslicer-a2802",
    storageBucket: "tdslicer-a2802.appspot.com",
    messagingSenderId: "210093740142",
    appId: "1:210093740142:web:82a86e739976740194d67f",
    measurementId: "G-50FD1587HR"
};

const app = firebase.initializeApp( firebaseConfig );
const storage = firebase.storage()
const db = firebase.firestore();

let camera, scene, renderer, object, loader, dirLight;
let planes, planeObjects, planeHelpers;
let clock, controls;
let clippedColorFront;

let uiSelectModel, uiPlanePos, uiSlicePlane, uiSliceView, uiCameraTop, uiSlicesCount;

let planePosition = 100;
let slCount = 1000;
let fileName = "Крепление2.stl"
let documentID = null;

let params = {

    loadModel: modelUpload,
    selectModel: 1,

    planeX: {

        planePos: 1,
        negated: false,
        slicePlane: false

    },
    planeY: {

        planePos: planePosition,
        negated: false,
        slicePlane: false,
        sliceView: false,
        cameraTop: false,
        slicesCount: slCount,
        loadSlices: loadBitmaps

    },
    planeZ: {

        planePos: 1,
        negated: false,
        slicePlane: false

    }
};

addGUI()
init();
animate();

document.addEventListener( 'dragover', e => e.preventDefault() )
document.addEventListener( 'drop', e => e.preventDefault() )
document.querySelector( "body" ).addEventListener( "dragenter", ( e ) => {
    document.getElementById( "dragArea" ).style.display = "flex"
    // console.log("enter", e.target)
})
document.querySelector( "body" ).addEventListener( "dragleave", ( e ) => {
    document.getElementById( "dragArea" ).style.display = "none"
    // console.log("leave", e.target)
})

// window.addEventListener("beforeunload", (event) => {
//     event.preventDefault()
//     let link = document.createElement("a")
//     link.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
//     event.returnValue = ''
// })

function modelUpload() {
    let i = document.querySelector( "input" )
    let reader = new FileReader()

    i.click()
    i.addEventListener('change', () => {
        fileName = i.files[0].name
        reader.onload = function ( e ) {
            modelLoad( e.target.result )
            uploadToFirebase( i.files[0] )
        }
        reader.readAsDataURL( i.files[0] );
    })
}

function uploadToFirebase( file ) {
    let userID = localStorage.getItem( "userID" )

    let storageRef = firebase.storage().ref( `${userID}/${file.name}` )
    storageRef.getDownloadURL()
        .then(() => {
            console.log(`File ${file.name} already exists`)
            // console.error(`File ${file.name} already exists`)
        })
        .catch( () => {
            let task = storageRef.put( file )
            task.on( "state_changed", () => {}, ( err ) => { console.log( err ) }, () => { console.log( "Complete!" ) } )
        })
}

function addGUI() {
    const gui = new GUI();

    gui.add( params, 'loadModel' )
    uiSelectModel = gui.add( params, 'selectModel' )

    const planeY = gui.addFolder( 'slicer' );
    uiSlicePlane = planeY.add( params.planeY, 'slicePlane' )
    uiSlicePlane.onChange( v => planeHelpers[1].visible = v );
    uiSlicePlane.onFinishChange( async (val) => {
        await updateModelData(documentID, {
            slicePlane: val
        })
    })

    uiPlanePos = planeY.add( params.planeY, 'planePos' ).min( - params.planeY.planePos ).max( params.planeY.planePos )
    uiPlanePos.onChange( d => planes[1].constant = d );
    uiPlanePos.onFinishChange( async (val) => {
        await updateModelData(documentID, {
            planePos: val
        })
    })

    uiSliceView = planeY.add( params.planeY, 'sliceView' )
    uiSliceView.onChange( () => {
        if ( params.planeY.sliceView ) {
            renderer.setClearColor( 0x0000000 )
            clippedColorFront.visible = false
            planeObjects[1].material.color.set( 0xFFFFFF )
            // dirLight.position.set( 0, 200, 0 );
        }
        else {
            renderer.setClearColor( 0x263238 )
            clippedColorFront.visible = true
            planeObjects[1].material.color.set( 0xE91E63 )
            // dirLight.position.set( 150, 150, 150 );
        }
    } );
    uiSliceView.onFinishChange(async (val) => {
        await updateModelData(documentID, {
            sliceView: val
        })
    })

    uiCameraTop = planeY.add( params.planeY, 'cameraTop' )
    uiCameraTop.onChange( () => {
        if ( params.planeY.cameraTop ) {
            camera.position.set( 0, 300, 0 );
            camera.lookAt( 0, 0, 0 );
            camera.updateProjectionMatrix();
        }
        else {
            camera.position.set( 200, 200, 200 );
            camera.lookAt( 0, 0, 0 );
            camera.updateProjectionMatrix();
        }
    });
    uiCameraTop.onFinishChange( async (val) => {
        await updateModelData(documentID, {
            cameraTop: val
        })
    })

    uiSlicesCount = planeY.add( params.planeY, 'slicesCount' ).min( 2 ).max( slCount ).step( 1 );
    uiSlicesCount.onFinishChange( async (val) => {
        await updateModelData(documentID, {
            slicesCount: val
        })
    })

    planeY.add( params.planeY, 'loadSlices' )

    planeY.open();
}

function createPlaneStencilGroup( geometry, plane, renderOrder ) {

    const group = new THREE.Group();
    const baseMat = new THREE.MeshBasicMaterial();
    baseMat.depthWrite = false;
    baseMat.depthTest = false;
    baseMat.colorWrite = false;
    baseMat.stencilWrite = true;
    baseMat.stencilFunc = THREE.AlwaysStencilFunc;

    const mat0 = baseMat.clone();
    mat0.side = THREE.BackSide;
    mat0.clippingPlanes = [plane];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;

    const mesh0 = new THREE.Mesh( geometry, mat0 );
    mesh0.renderOrder = renderOrder;
    group.add( mesh0 );

    const mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [plane];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    const mesh1 = new THREE.Mesh( geometry, mat1 );
    mesh1.renderOrder = renderOrder;

    group.add( mesh1 );

    return group;

}

function init() {
    firebase.auth().signInAnonymously()
        .then( () => { console.log( "Authorized!" ) } )
    firebase.auth().onAuthStateChanged( (user) => {
        if (user) {
            localStorage.setItem( "userID", user.uid )
        }
    } )

    clock = new THREE.Clock();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( 200, 200, 200 );

    scene.add( new THREE.AmbientLight( 0xffffff, 0.5 ) );

    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.position.set( 150, 150, 150 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.top	= 2;
    dirLight.shadow.camera.bottom = - 2;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add( dirLight );

    loader = new STLLoader();

    getLastModelUrl(localStorage.getItem( "userID" ))
        .then((url) => {
            modelLoad( url )

            renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
            renderer.shadowMap.enabled = true;
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( window.innerWidth, window.innerHeight );
            renderer.setClearColor( 0x263238 );
            window.addEventListener( 'resize', onWindowResize );
            document.body.appendChild( renderer.domElement );

            renderer.localClippingEnabled = true;

            controls = new OrbitControls( camera, renderer.domElement );
            controls.minDistance = 2;
            controls.maxDistance = 1000;
            controls.update();

            callback()
        })
}

async function getUserModels(userID) {
    if ( !userID ) return []
    debugger
    const modelsRef = collection( db, "models" )
    const q = query( modelsRef, where( "userID", "==", userID ) )
    const data = await getDocs( q )
    if (data.empty) {
        return []
    }
    return data.docs.map((el) => {
        return {
            fileName: el.data().fileName,
            filePath: el.data().filePath,
            time: el.data().time
        }
    }).sort((a, b) => b.time - a.time)
}

async function getLastModelUrl(userID, callback) {
    let models = await getUserModels(userID)
    // debugger
    if (models.length === 0) {
        return "https://firebasestorage.googleapis.com/v0/b/tdslicer-a2802.appspot.com/o/%D0%9A%D1%80%D0%B5%D0%BF%D0%BB%D0%B5%D0%BD%D0%B8%D0%B52.stl?alt=media&token=116bb146-00f2-4700-badd-7e79622ceac5"
    }
    else {
        fileName = models[0].fileName
        filePath = models[0].filePath

        let url = await getModelUrl(models[0].filePath)
        // debugger
        console.log(url, userID, models)
        return url
    }
}

/**
 * Получение или создание записи в бд для модели пользователя
 * @param userID - Id пользователя
 * @param fileName - Имя файла
 * @param data - данные, которые будут записаны, если их не существует
 * @returns {Promise<*[id, data]>} - Id записи и данные модели (либо существующие, либо новые)
 */
async function readOrCreateModelData( userID, fileName, data ) {
    let [id, model] = await readModelData( userID, fileName )
    if (!model) {
        [id, model] = await writeModelData(userID, fileName, data)
    }
    return [id, model]
}

async function readModelData( userID, fileName ) {
    const modelsRef = collection( db, "models" )
    console.log(`Search model '${fileName} for user ${userID}'`)
    const q = query( modelsRef, where( "userID", "==", userID ), where( "fileName", "==", fileName ) )
    const data = await getDocs( q )
    if (data.empty) {
        console.log("Model data not fount");
        return [null, null]
    }
    // documentID = data.docs[0].id
    return [data.docs[0].id, data.docs[0].data()]
}

async function writeModelData( userID, fileName, data ) {
    let result = await db.collection( "models" ).add( {
        userID,
        fileName,
        filePath,
        time : new Date().getTime(),
        ...data
    } )
    return [result.id, data]
}

async function updateModelData( documentID, data ) {
    if(!documentID) return
    console.log(`Update doc '${documentID}'`, data)
    await db.collection("models").doc(documentID).update( {
        ...data,
        time : new Date().getTime()
    } )
}

function modelLoad( model ) {
    //let modelData = readModelData( localStorage.getItem( "userID" ), fileName )
    // console.log(modelData, documentID)
    // console.log(modelData.then(res => { return res } ))

    scene = new THREE.Scene();
    scene.add( new THREE.AmbientLight( 0xffffff, 0.5 ) );
    scene.add( dirLight );

    let geometry = new THREE.BufferGeometry()

    document.getElementById( "loader" ).style.display = "flex"
    loader.load( model, function ( geom ) {
        // console.log(geom)
        geometry.copy( geom )
        geometry.center()
        geometry.rotateX( -Math.PI / 2 )
        geometry.rotateY( Math.PI / 3 )
        console.log( geometry )

        // size = geometry.boundingSphere.radius
        planePosition = Number( geometry.boundingBox.max.y.toFixed( 2 ) ) + 0.1 /// Fix

        // uiPlanePos.min( - planePosition ).max( planePosition )
        // uiPlanePos.setValue( planePosition )
        // uiSlicesCount.min( Math.round( planePosition ) ).max( 1000 )
        // uiSlicesCount.setValue( 1000 )

        readOrCreateModelData( localStorage.getItem( "userID" ), fileName, {
            slicePlane : false,
            planePos : planePosition,
            sliceView : false,
            cameraTop : false,
            slicesCount: 1000
        } )
            .then( data => {
                let [id, modelData] = data
                documentID = id

                uiSlicePlane.setValue( modelData.slicePlane )
                uiPlanePos.setValue( modelData.planePos )
                uiSliceView.setValue( modelData.sliceView )
                uiCameraTop.setValue( modelData.cameraTop )
                uiSlicesCount.setValue( modelData.slicesCount )
            })
            .catch(() => {
                console.log("Read or Write error")
            })
            .finally( () => {
                document.getElementById("loader").style.display = "none"
                uiPlanePos.min(-planePosition).max(planePosition)
                uiSlicesCount.min(Math.round(planePosition)).max(1000)
                uiPlanePos.updateDisplay()
                uiSlicesCount.updateDisplay()
            })

    });


    //const geometry = new THREE.TorusKnotGeometry( 0.4, 0.15, 220, 60 );
    object = new THREE.Group();
    scene.add( object );

    planes = [
        new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), planePosition * 10 ),
        new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), planePosition ),
        new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), planePosition * 10 )
    ];

    planeHelpers = planes.map( p => new THREE.PlaneHelper( p, 100, 0x000000 ) );
    planeHelpers.forEach( ph => {

        ph.visible = false;
        // ph.material.color.setHex( 0xff9a00 );
        scene.add( ph );

    } );

    planeObjects = [];
    const planeGeom = new THREE.PlaneGeometry( 100, 100 );

    for ( let i = 0; i < 3; i ++ ) {

        const poGroup = new THREE.Group();
        const plane = planes[i]
        const stencilGroup = createPlaneStencilGroup( geometry, plane, i + 1 );

        const planeMat =
            new THREE.MeshStandardMaterial( {

                color: 0xE91E63,
                // color: 0xFFFFFF,
                metalness: 0.1,
                roughness: 0.75,
                clippingPlanes: planes.filter( p => p !== plane ),

                stencilWrite: true,
                stencilRef: 0,
                stencilFunc: THREE.NotEqualStencilFunc,
                stencilFail: THREE.ReplaceStencilOp,
                stencilZFail: THREE.ReplaceStencilOp,
                stencilZPass: THREE.ReplaceStencilOp,

            } );
        const po = new THREE.Mesh( planeGeom, planeMat );
        po.onAfterRender = function ( renderer ) {

            renderer.clearStencil();

        };

        po.renderOrder = i + 1.1;

        object.add( stencilGroup );
        poGroup.add( po );
        planeObjects.push( po );
        scene.add( poGroup );

    }

    const material = new THREE.MeshStandardMaterial( {

        color: 0xFFC107,
        metalness: 0.1,
        roughness: 0.75,
        clippingPlanes: planes,
        clipShadows: true,
        shadowSide: THREE.DoubleSide,

    } );

    clippedColorFront = new THREE.Mesh( geometry, material );
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;

    object.add( clippedColorFront );

    // camera.position.set( 200, 200, 200 );
    // dirLight.position.set( 150, 150, 150 );
    //
    // controls.minDistance = 2;
    // controls.maxDistance = 1000;
    // controls.update();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    for ( let i = 0; i < planeObjects.length; i ++ ) {

        const plane = planes[i];
        const po = planeObjects[i];
        plane.coplanarPoint( po.position );
        po.lookAt(
            po.position.x - plane.normal.x,
            po.position.y - plane.normal.y,
            po.position.z - plane.normal.z,
        );

    }

    renderer.render( scene, camera );

}

function getCanvasBlob( canvas ) {
    return new Promise( function( resolve, reject ) {
        canvas.toBlob( function( blob ) {
            resolve( blob )
        }, "image/bmp" )
    })
}

async function loadBitmaps() {
    document.getElementById( "loader" ).style.display = "flex"

    planeHelpers[1].visible = false
    renderer.setClearColor( 0x0000000 )
    clippedColorFront.visible = false
    planeObjects[1].material.color.set( 0xFFFFFF )

    camera.position.set( 0, 300, 0 );
    camera.lookAt( 0, 0, 0 );
    camera.updateProjectionMatrix();

    let zip = new JSZip();
    let len = params.planeY.slicesCount

    for (let i = -1; i < len; i++) {
        planes[1].constant = 2 * planePosition / ( len - 1 ) * i - ( planePosition - 1 )
        document.getElementById( "load-info" ).innerText = ( i + 1 ) + " slices of " + len + " is ready"
        // console.log( "Generated", i, planes[1].constant )

        let blob = await getCanvasBlob( renderer.domElement )
        zip.file( "slice" + i + ".bmp", blob )
    }

    zip.remove( "slice-1.bmp" )
    document.getElementById( "load-info" ).innerText = "Zip archive is going..."
    console.log( "Zip is ready" )

    zip.generateAsync( { type:"base64" } )
        .then( function( content ) {
            let link = document.createElement( "a" )
            link.download = fileName.substring( 0, fileName.length - 4 ) + "_" + len + ".zip"
            link.href = "data:application/zip;base64," + content
            link.click()
            document.getElementById( "loader" ).style.display = "none"
            document.getElementById( "load-info" ).innerText = "One second, model is loading..."
        });

    renderer.setClearColor( 0x263238 )
    clippedColorFront.visible = true
    planeObjects[1].material.color.set( 0xE91E63 )

    camera.position.set( 200, 200, 200 );
    camera.lookAt( 0, 0, 0 );
    camera.updateProjectionMatrix();
}
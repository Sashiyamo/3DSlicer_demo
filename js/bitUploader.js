// document.addEventListener("load", () => {
//     let bit = createImageBitmap(document.querySelector("canvas"))
// })

// // import * as THREE from 'three';
// // import { OrbitControls } from 'https://unpkg.com/three@0.139.0/examples/jsm/controls/OrbitControls.js';
// // import { GUI } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/lil-gui.module.min.js';
// // import { STLLoader } from 'https://unpkg.com/three@0.139.0/examples/jsm/loaders/STLLoader.js'
// // import JSZip from '../node_modules/jszip/dist/jszip.min.js';
//
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
// import JSZip from 'jszip';
//
// let camera, scene, renderer, object, loader;
// let planes, planeObjects, planeHelpers;
// let clock;
// let clippedColorFront;
//
// let uiPlanePos, uiSlicePlane, uiSliceView, uiCameraTop, uiSlicesCount;
//
// let planePosition = 45.1
// let slCount = 1000
//
// let params = {
//
//     planeX: {
//
//         planePos: 1,
//         negated: false,
//         slicePlane: false
//
//     },
//     planeY: {
//
//         planePos: planePosition,
//         negated: false,
//         slicePlane: false,
//         sliceView: false,
//         cameraTop: false,
//         slicesCount: slCount,
//         loadSlices: loadBitmaps
//
//     },
//     planeZ: {
//
//         planePos: 1,
//         negated: false,
//         slicePlane: false
//
//     }
// };
//
// init();
// animate();
//
// function createPlaneStencilGroup( geometry, plane, renderOrder ) {
//
//     const group = new THREE.Group();
//     const baseMat = new THREE.MeshBasicMaterial();
//     baseMat.depthWrite = false;
//     baseMat.depthTest = false;
//     baseMat.colorWrite = false;
//     baseMat.stencilWrite = true;
//     baseMat.stencilFunc = THREE.AlwaysStencilFunc;
//
//     const mat0 = baseMat.clone();
//     mat0.side = THREE.BackSide;
//     mat0.clippingPlanes = [ plane ];
//     mat0.stencilFail = THREE.IncrementWrapStencilOp;
//     mat0.stencilZFail = THREE.IncrementWrapStencilOp;
//     mat0.stencilZPass = THREE.IncrementWrapStencilOp;
//
//     const mesh0 = new THREE.Mesh( geometry, mat0 );
//     mesh0.renderOrder = renderOrder;
//     group.add( mesh0 );
//
//     const mat1 = baseMat.clone();
//     mat1.side = THREE.FrontSide;
//     mat1.clippingPlanes = [ plane ];
//     mat1.stencilFail = THREE.DecrementWrapStencilOp;
//     mat1.stencilZFail = THREE.DecrementWrapStencilOp;
//     mat1.stencilZPass = THREE.DecrementWrapStencilOp;
//
//     const mesh1 = new THREE.Mesh( geometry, mat1 );
//     mesh1.renderOrder = renderOrder;
//
//     group.add( mesh1 );
//
//     return group;
//
// }
//
// function init() {
//     clock = new THREE.Clock();
//
//     scene = new THREE.Scene();
//
//     camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 0.1, 1000 );
//     camera.position.set( 200, 200, 200 );
//
//     scene.add( new THREE.AmbientLight( 0xffffff, 0.5 ) );
//
//     const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
//     dirLight.position.set( 150, 150, 150 );
//     dirLight.castShadow = true;
//     dirLight.shadow.camera.right = 2;
//     dirLight.shadow.camera.left = - 2;
//     dirLight.shadow.camera.top	= 2;
//     dirLight.shadow.camera.bottom = - 2;
//
//     dirLight.shadow.mapSize.width = 1024;
//     dirLight.shadow.mapSize.height = 1024;
//     scene.add( dirLight );
//
//     loader = new STLLoader();
//     let geometry = new THREE.BufferGeometry()
//
//     document.getElementById("loader").style.display = "flex"
//     loader.load("2.stl", function (geom) {
//         // console.log(geom)
//
//         geometry.copy(geom)
//         geometry.center()
//         geometry.rotateX(-Math.PI / 2)
//         geometry.rotateY(Math.PI / 3)
//         console.log(geometry)
//         planePosition = geometry.boundingBox.max.y
//         // console.log(planePosition)
//
//         params.planeY.planePos = planePosition
//         // console.log(params.planeY.planePos)
//
//         document.getElementById("loader").style.display = "none"
//     });
//
//     //const geometry = new THREE.TorusKnotGeometry( 0.4, 0.15, 220, 60 );
//     object = new THREE.Group();
//     scene.add( object );
//
//     planes = [
//         new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 100 ),
//         new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), planePosition ),
//         new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 100 )
//     ];
//
//     planeHelpers = planes.map( p => new THREE.PlaneHelper( p, 100, 0x000000 ) );
//     planeHelpers.forEach( ph => {
//
//         ph.visible = false;
//         // ph.material.color.setHex( 0xff9a00 );
//         scene.add( ph );
//
//     } );
//
//     planeObjects = [];
//     const planeGeom = new THREE.PlaneGeometry( 100, 100 );
//
//     for ( let i = 0; i < 3; i ++ ) {
//
//         const poGroup = new THREE.Group();
//         const plane = planes[i]
//         const stencilGroup = createPlaneStencilGroup( geometry, plane, i + 1 );
//
//         const planeMat =
//             new THREE.MeshStandardMaterial( {
//
//                 color: 0xE91E63,
//                 // color: 0xFFFFFF,
//                 metalness: 0.1,
//                 roughness: 0.75,
//                 clippingPlanes: planes.filter( p => p !== plane ),
//
//                 stencilWrite: true,
//                 stencilRef: 0,
//                 stencilFunc: THREE.NotEqualStencilFunc,
//                 stencilFail: THREE.ReplaceStencilOp,
//                 stencilZFail: THREE.ReplaceStencilOp,
//                 stencilZPass: THREE.ReplaceStencilOp,
//
//             } );
//         const po = new THREE.Mesh( planeGeom, planeMat );
//         po.onAfterRender = function ( renderer ) {
//
//             renderer.clearStencil();
//
//         };
//
//         po.renderOrder = i + 1.1;
//
//         object.add( stencilGroup );
//         poGroup.add( po );
//         planeObjects.push( po );
//         scene.add( poGroup );
//
//     }
//
//     const material = new THREE.MeshStandardMaterial( {
//
//         color: 0xFFC107,
//         metalness: 0.1,
//         roughness: 0.75,
//         clippingPlanes: planes,
//         clipShadows: true,
//         shadowSide: THREE.DoubleSide,
//
//     } );
//
//     clippedColorFront = new THREE.Mesh( geometry, material );
//     clippedColorFront.castShadow = true;
//     clippedColorFront.renderOrder = 6;
//
//     object.add( clippedColorFront );
//
//
//     const ground = new THREE.Mesh(
//         new THREE.PlaneGeometry( 100, 100, 1, 1 ),
//         new THREE.ShadowMaterial( { color: 0x000000, opacity: 0.25, side: THREE.DoubleSide } )
//     );
//
//     ground.rotation.x = - Math.PI / 2;
//     ground.position.y = - 1;
//     ground.receiveShadow = true;
//     scene.add( ground );
//
//     renderer = new THREE.WebGLRenderer( { antialias: true, preserveDrawingBuffer: true } );
//     renderer.shadowMap.enabled = true;
//     renderer.setPixelRatio( window.devicePixelRatio );
//     renderer.setSize( window.innerWidth, window.innerHeight );
//     renderer.setClearColor( 0x263238 );
//     window.addEventListener( 'resize', onWindowResize );
//     document.body.appendChild( renderer.domElement );
//
//     renderer.localClippingEnabled = true;
//
//     const controls = new OrbitControls( camera, renderer.domElement );
//     controls.minDistance = 2;
//     controls.maxDistance = 1000;
//     controls.update();
//
//     const gui = new GUI();
//
//     // const planeX = gui.addFolder( 'planeX' );
//     // planeX.add( params.planeX, 'displayHelper' ).onChange( v => planeHelpers[ 0 ].visible = v );
//     // planeX.add( params.planeX, 'planePos' ).min( - 1 ).max( 1 ).onChange( d => planes[ 0 ].constant = d );
//     // planeX.add( params.planeX, 'negated' ).onChange( () => {
//     //
//     // 	planes[ 0 ].negate();
//     // 	params.planeX.constant = planes[ 0 ].constant;
//     //
//     // } );
//     // planeX.open();
//     const planeY = gui.addFolder( 'slicer' );
//     uiSlicePlane = planeY.add( params.planeY, 'slicePlane' )
//     uiSlicePlane.onChange( v => planeHelpers[1].visible = v );
//
//     uiPlanePos = planeY.add( params.planeY, 'planePos' ).min( - planePosition ).max( planePosition )
//     uiPlanePos.onChange( d => planes[1].constant = d );
//
//     uiSliceView = planeY.add( params.planeY, 'sliceView' )
//     uiSliceView.onChange( () => {
//         if (params.planeY.sliceView) {
//             renderer.setClearColor( 0x0000000 )
//             clippedColorFront.visible = false
//             planeObjects[1].material.color.set( 0xFFFFFF )
//             // dirLight.position.set( 0, 200, 0 );
//         }
//         else {
//             renderer.setClearColor( 0x263238 )
//             clippedColorFront.visible = true
//             planeObjects[1].material.color.set( 0xE91E63 )
//             // dirLight.position.set( 150, 150, 150 );
//         }
//     } );
//
//     uiCameraTop = planeY.add( params.planeY, 'cameraTop' )
//     uiCameraTop.onChange( () => {
//         if (params.planeY.cameraTop) {
//             camera.position.set( 0, 300, 0 );
//             camera.lookAt( 0, 0, 0 );
//             camera.updateProjectionMatrix();
//         }
//         else {
//             camera.position.set( 200, 200, 200 );
//             camera.lookAt( 0, 0, 0 );
//             camera.updateProjectionMatrix();
//         }
//     });
//
//     uiSlicesCount = planeY.add( params.planeY, 'slicesCount' ).min( 2 ).max( slCount );
//
//     planeY.add( params.planeY, 'loadSlices')
//     // planeY.add( params.planeY, 'negated' ).onChange( () => {
//     //
//     // 	planes[ 1 ].negate();
//     // 	params.planeY.constant = planes[ 1 ].constant;
//     //
//     // } );
//     planeY.open();
//
//     // const planeZ = gui.addFolder( 'planeZ' );
//     // planeZ.add( params.planeZ, 'displayHelper' ).onChange( v => planeHelpers[ 2 ].visible = v );
//     // planeZ.add( params.planeZ, 'planePos' ).min( - 1 ).max( 1 ).onChange( d => planes[ 2 ].constant = d );
//     // planeZ.add( params.planeZ, 'negated' ).onChange( () => {
//     //
//     // 	planes[ 2 ].negate();
//     // 	params.planeZ.constant = planes[ 2 ].constant;
//     //
//     // } );
//     // planeZ.open();
//
// }
//
// function onWindowResize() {
//
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//
//     renderer.setSize( window.innerWidth, window.innerHeight );
//
// }
//
// function animate() {
//
//     requestAnimationFrame( animate );
//
//     for ( let i = 0; i < planeObjects.length; i ++ ) {
//
//         const plane = planes[ i ];
//         const po = planeObjects[ i ];
//         plane.coplanarPoint( po.position );
//         po.lookAt(
//             po.position.x - plane.normal.x,
//             po.position.y - plane.normal.y,
//             po.position.z - plane.normal.z,
//         );
//
//     }
//
//     renderer.render( scene, camera );
//
// }
//
// function getCanvasBlob(canvas) {
//     return new Promise(function(resolve, reject) {
//         canvas.toBlob(function(blob) {
//             resolve(blob)
//         }, "image/bmp")
//     })
// }
//
// async function loadBitmaps() {
//     document.getElementById("loader").style.display = "flex"
//
//     planeHelpers[1].visible = false
//     renderer.setClearColor( 0x0000000 )
//     clippedColorFront.visible = false
//     planeObjects[1].material.color.set( 0xFFFFFF )
//
//     camera.position.set( 0, 300, 0 );
//     camera.lookAt( 0, 0, 0 );
//     camera.updateProjectionMatrix();
//
//     let zip = new JSZip();
//     let len = Math.round(params.planeY.slicesCount)
//     console.log(planePosition)
//
//     for (let i = -1; i < len; i++) {
//         planes[1].constant = 2 * planePosition / (len - 1) * i - (planePosition - 1)
//         document.getElementById("load-info").innerText = (i + 1) + " slices of " + len + " is ready"
//         console.log("Generated", i, planes[1].constant)
//
//         let blob = await getCanvasBlob(renderer.domElement)
//         zip.file("slice" + i + ".bmp", blob)
//     }
//
//     zip.remove("slice-1.bmp")
//     document.getElementById("load-info").innerText = "Zip archive is going..."
//     console.log("Zip is ready")
//
//     zip.generateAsync({type:"base64"})
//         .then(function(content) {
//             let link = document.createElement("a")
//             link.download = "slices.zip"
//             link.href = "data:application/zip;base64," + content
//             link.click()
//             document.getElementById("loader").style.display = "none"
//             document.getElementById("load-info").innerText = "One second, model is loading..."
//         });
//
//     renderer.setClearColor( 0x263238 )
//     clippedColorFront.visible = true
//     planeObjects[1].material.color.set( 0xE91E63 )
//
//     camera.position.set( 200, 200, 200 );
//     camera.lookAt( 0, 0, 0 );
//     camera.updateProjectionMatrix();
// }
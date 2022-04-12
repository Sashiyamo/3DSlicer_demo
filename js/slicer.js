// import * as THREE from '../build/three.module.js';
// import { OrbitControls } from './jsm/controls/OrbitControls.js';
// import { GUI } from './jsm/libs/lil-gui.module.min.js';
// import { STLLoader } from './jsm/loaders/STLLoader.js';

import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.139.0/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://unpkg.com/three@0.139.0/examples/jsm/libs/lil-gui.module.min.js';
import { STLLoader } from 'https://unpkg.com/three@0.139.0/examples/jsm/loaders/STLLoader.js'

// import * as THREE from '../node_modules/three/build/three.module.js';
// import * as THREE from 'three';
// import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
// import { GUI } from '../node_modules/three/examples/jsm/libs/lil-gui.module.min.js';
// import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
// import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { STLLoader } from '../node_modules/three/examples/jsm/loaders/STLLoader.js'


let camera, scene, renderer, object, loader;
let planes, planeObjects, planeHelpers;
let clock;

let planePosition = 45.1

let params = {

    planeX: {

        constant: 1,
        negated: false,
        slicePlane: false

    },
    planeY: {

        constant: planePosition,
        negated: false,
        slicePlane: false,
        sliceView: false,
        cameraTop: false

    },
    planeZ: {

        constant: 1,
        negated: false,
        slicePlane: false

    }
};

init();
animate();

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
    mat0.clippingPlanes = [ plane ];
    mat0.stencilFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZFail = THREE.IncrementWrapStencilOp;
    mat0.stencilZPass = THREE.IncrementWrapStencilOp;

    const mesh0 = new THREE.Mesh( geometry, mat0 );
    mesh0.renderOrder = renderOrder;
    group.add( mesh0 );

    const mat1 = baseMat.clone();
    mat1.side = THREE.FrontSide;
    mat1.clippingPlanes = [ plane ];
    mat1.stencilFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZFail = THREE.DecrementWrapStencilOp;
    mat1.stencilZPass = THREE.DecrementWrapStencilOp;

    const mesh1 = new THREE.Mesh( geometry, mat1 );
    mesh1.renderOrder = renderOrder;

    group.add( mesh1 );

    return group;

}

function init() {

    clock = new THREE.Clock();

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.set( 200, 200, 200 );

    scene.add( new THREE.AmbientLight( 0xffffff, 0.5 ) );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
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
    let geometry = new THREE.BufferGeometry()

    loader.load("2.stl", function (geom) {
        geometry.copy(geom)
        geometry.center()
        geometry.rotateX(-Math.PI / 2)
        geometry.rotateY(Math.PI / 3)
        console.log(geometry)
        planePosition = geometry.boundingBox.max.y
        // console.log(planePosition)

        params.planeY.constant = planePosition
        // console.log(params.planeY.constant)
    });

    //const geometry = new THREE.TorusKnotGeometry( 0.4, 0.15, 220, 60 );
    object = new THREE.Group();
    scene.add( object );

    planes = [
        new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 100 ),
        new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), planePosition ),
        new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 100 )
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

    const clippedColorFront = new THREE.Mesh( geometry, material );
    clippedColorFront.castShadow = true;
    clippedColorFront.renderOrder = 6;
    object.add( clippedColorFront );


    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry( 100, 100, 1, 1 ),
        new THREE.ShadowMaterial( { color: 0x000000, opacity: 0.25, side: THREE.DoubleSide } )
    );

    ground.rotation.x = - Math.PI / 2;
    ground.position.y = - 1;
    ground.receiveShadow = true;
    scene.add( ground );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x263238 );
    window.addEventListener( 'resize', onWindowResize );
    document.body.appendChild( renderer.domElement );

    renderer.localClippingEnabled = true;

    const controls = new OrbitControls( camera, renderer.domElement );
    controls.minDistance = 2;
    controls.maxDistance = 1000;
    controls.update();

    const gui = new GUI();

    // const planeX = gui.addFolder( 'planeX' );
    // planeX.add( params.planeX, 'displayHelper' ).onChange( v => planeHelpers[ 0 ].visible = v );
    // planeX.add( params.planeX, 'constant' ).min( - 1 ).max( 1 ).onChange( d => planes[ 0 ].constant = d );
    // planeX.add( params.planeX, 'negated' ).onChange( () => {
    //
    // 	planes[ 0 ].negate();
    // 	params.planeX.constant = planes[ 0 ].constant;
    //
    // } );
    // planeX.open();

    const planeY = gui.addFolder( 'slicer' );
    planeY.add( params.planeY, 'slicePlane' ).onChange( v => planeHelpers[ 1 ].visible = v );
    planeY.add( params.planeY, 'constant' ).min( - planePosition ).max( planePosition ).onChange( d => planes[ 1 ].constant = d );
    planeY.add( params.planeY, 'sliceView' ).onChange( () => {
        if (params.planeY.sliceView) {
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
    planeY.add( params.planeY, 'cameraTop' ).onChange( () => {
        if (params.planeY.cameraTop) {
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
    // planeY.add( params.planeY, 'negated' ).onChange( () => {
    //
    // 	planes[ 1 ].negate();
    // 	params.planeY.constant = planes[ 1 ].constant;
    //
    // } );
    planeY.open();

    // const planeZ = gui.addFolder( 'planeZ' );
    // planeZ.add( params.planeZ, 'displayHelper' ).onChange( v => planeHelpers[ 2 ].visible = v );
    // planeZ.add( params.planeZ, 'constant' ).min( - 1 ).max( 1 ).onChange( d => planes[ 2 ].constant = d );
    // planeZ.add( params.planeZ, 'negated' ).onChange( () => {
    //
    // 	planes[ 2 ].negate();
    // 	params.planeZ.constant = planes[ 2 ].constant;
    //
    // } );
    // planeZ.open();

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    for ( let i = 0; i < planeObjects.length; i ++ ) {

        const plane = planes[ i ];
        const po = planeObjects[ i ];
        plane.coplanarPoint( po.position );
        po.lookAt(
            po.position.x - plane.normal.x,
            po.position.y - plane.normal.y,
            po.position.z - plane.normal.z,
        );

    }

    renderer.render( scene, camera );

}
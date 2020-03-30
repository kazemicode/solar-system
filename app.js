// Sara Kazemi
// CST 325 - Module 8 - Final

'use strict'

var gl;

var appInput = new Input();
var time = new Time();
var camera = new OrbitCamera(appInput);

// celestial body scaling factors
var sunScale = new Matrix4().scale(0.05, 0.05, 0.05);
var earthScale = new Matrix4().scale(0.03, 0.03, 0.03);
var moonScale = new Matrix4().scale(0.005, 0.005, 0.005);

// celestial body init positions
var lightPosition = new Vector3(0, 1.5, 0);
var earthPosition = new Vector3(-8, -1, -5);
var moonPosition = new Vector3(earthPosition.x - 4, earthPosition.y, earthPosition.z);



var sunGeometry     = null,
    earthGeometry   = null,
    moonGeometry    = null,
    universeGeometry = null;

var projectionMatrix = new Matrix4();

// diffuse point light coming from center of sun
var diffuseShaderProgram;
// emissive lighting for sun
var textureShaderProgram;

// auto start the app when the html page is ready
window.onload = window['initializeAndStartRendering'];

// we need to asynchronously fetch files from the "server" (your local hard drive)
var loadedAssets = {
    diffuseTextVS: null, diffuseTextFS: null,
    textureTextVS: null, textureTextFS: null,
    sphereJSON: null,
    sunImage: null,
    earthImage: null, 
    moonImage: null,
    universeImage: null
};

// -------------------------------------------------------------------------
function initializeAndStartRendering() {
    initGL();
    loadAssets(function() {
        createShaders(loadedAssets);
        createScene();
        updateAndRender();
    });
}

// -------------------------------------------------------------------------
function initGL(canvas) {
    var canvas = document.getElementById("webgl-canvas");

    try {
        gl = canvas.getContext("webgl");
        gl.canvasWidth = canvas.width;
        gl.canvasHeight = canvas.height;

        gl.enable(gl.DEPTH_TEST);
    } catch (e) {}

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// -------------------------------------------------------------------------
function loadAssets(onLoadedCB) {
    var filePromises = [
        fetch('./shaders/diffuse.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/diffuse.pointlit.fs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/unlit.textured.vs.glsl').then((response) => { return response.text(); }),
        fetch('./shaders/unlit.textured.fs.glsl').then((response) => { return response.text(); }),
        fetch('./data/sphere.json').then((response) => { return response.json(); }),
        loadImage('./data/sun.jpg'),
        loadImage('./data/earth.jpg'),
        loadImage('./data/moon.png'),
        loadImage('./data/starfield.jpg')

    ];

    Promise.all(filePromises).then(function(values) {
        // Assign loaded data to our named variables
        loadedAssets.diffuseTextVS = values[0];
        loadedAssets.diffuseTextFS = values[1];
        loadedAssets.textureTextVS = values[2];
        loadedAssets.textureTextFS = values[3];
        loadedAssets.sphereJSON = values[4];
        loadedAssets.sunImage = values[5];
        loadedAssets.earthImage = values[6];
        loadedAssets.moonImage = values[7];
        loadedAssets.universeImage = values[8];


    }).catch(function(error) {
        console.error(error.message);
    }).finally(function() {
        onLoadedCB();
    });
}

// -------------------------------------------------------------------------
function createShaders(loadedAssets) {
    diffuseShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.diffuseTextVS, loadedAssets.diffuseTextFS);

    diffuseShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(diffuseShaderProgram, "aVertexPosition"),
        vertexNormalsAttribute: gl.getAttribLocation(diffuseShaderProgram, "aNormal"),
        vertexTexcoordsAttribute: gl.getAttribLocation(diffuseShaderProgram, "aTexcoords")
    };

    diffuseShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(diffuseShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(diffuseShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(diffuseShaderProgram, "uProjectionMatrix"),
        lightPositionUniform: gl.getUniformLocation(diffuseShaderProgram, "uLightPosition"),
        cameraPositionUniform: gl.getUniformLocation(diffuseShaderProgram, "uCameraPosition"),
        textureUniform: gl.getUniformLocation(diffuseShaderProgram, "uTexture"),
    };

    textureShaderProgram = createCompiledAndLinkedShaderProgram(loadedAssets.textureTextVS, loadedAssets.textureTextFS);

    textureShaderProgram.attributes = {
        vertexPositionAttribute: gl.getAttribLocation(textureShaderProgram, "aVertexPosition"),
        vertexTexcoordsAttribute: gl.getAttribLocation(textureShaderProgram, "aTexcoords")
    };

    textureShaderProgram.uniforms = {
        worldMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uWorldMatrix"),
        viewMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uViewMatrix"),
        projectionMatrixUniform: gl.getUniformLocation(textureShaderProgram, "uProjectionMatrix"),
        textureUniform: gl.getUniformLocation(textureShaderProgram, "uTexture"),
        
    };
}

// -------------------------------------------------------------------------
function createScene() {

    // geometry and mapping textures
    universeGeometry = new WebGLGeometryJSON(gl, textureShaderProgram);
    universeGeometry.create(loadedAssets.sphereJSON, loadedAssets.universeImage);

    sunGeometry = new WebGLGeometryJSON(gl, textureShaderProgram);
    sunGeometry.create(loadedAssets.sphereJSON, loadedAssets.sunImage);

    earthGeometry = new WebGLGeometryJSON(gl, diffuseShaderProgram);
    earthGeometry.create(loadedAssets.sphereJSON, loadedAssets.earthImage);

    moonGeometry = new WebGLGeometryJSON(gl, diffuseShaderProgram);
    moonGeometry.create(loadedAssets.sphereJSON, loadedAssets.moonImage);

    // scaling
    sunGeometry.worldMatrix.identity();
    sunGeometry.worldMatrix.multiplyRightSide(sunScale);


    earthGeometry.worldMatrix.identity();
    earthGeometry.worldMatrix.multiplyRightSide(earthScale);

    moonGeometry.worldMatrix.identity();
    moonGeometry.worldMatrix.multiplyRightSide(moonScale);

    // positioning
    sunGeometry.worldMatrix.translate(lightPosition.x, lightPosition.y, lightPosition.z);
    earthGeometry.worldMatrix.translate(earthPosition.x, earthPosition.y, earthPosition.z);
    moonGeometry.worldMatrix.translate(moonPosition.x, moonPosition.y, moonPosition.z);
    universeGeometry.worldMatrix.translate(lightPosition.x, lightPosition.y, lightPosition.z);
}

// -------------------------------------------------------------------------
function updateAndRender() {
    requestAnimationFrame(updateAndRender);

    var aspectRatio = gl.canvasWidth / gl.canvasHeight;

    time.update();
    camera.update(time.deltaTime);

    // specify what portion of the canvas we want to draw to (all of it, full width and height)
    gl.viewport(0, 0, gl.canvasWidth, gl.canvasHeight);

    // this is a new frame so let's clear out whatever happened last frame
    gl.clearColor(0.707, 0.707, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(diffuseShaderProgram);
    var uniforms = diffuseShaderProgram.uniforms;
    var cameraPosition = camera.getPosition();
    gl.uniform3f(uniforms.lightPositionUniform, lightPosition.x, lightPosition.y, lightPosition.z);
    gl.uniform3f(uniforms.cameraPositionUniform, cameraPosition.x, cameraPosition.y, cameraPosition.z);

   
   // rotate celestial bodies
   rotateSphere(sunScale, sunGeometry, 80);
   rotateSphere(earthScale, earthGeometry, 20);
   rotateSphere(moonScale, moonGeometry, 1.7);
   earthGeometry.worldMatrix.translate(earthPosition.x, earthPosition.y, earthPosition.z);
   moonGeometry.worldMatrix.translate(moonPosition.x, moonPosition.y, moonPosition.z);
   

    // revolve 
    earthPosition = revolveSphere(earthPosition, 8);
    moonPosition = revolveMoon(lightPosition, 12);
  

    projectionMatrix.setPerspective(45, aspectRatio, 0.1, 1000);
    universeGeometry.render(camera, projectionMatrix, textureShaderProgram);
    sunGeometry.render(camera, projectionMatrix, textureShaderProgram);
    earthGeometry.render(camera, projectionMatrix, diffuseShaderProgram);
    moonGeometry.render(camera, projectionMatrix, diffuseShaderProgram);
   
}


function revolveSphere(spherePosition, radius) { 
    return spherePosition = new Vector3(Math.cos(time.secondsElapsedSinceStart) * radius, 1, Math.sin(time.secondsElapsedSinceStart) * radius);
}

function revolveMoon(spherePosition, radius)
{
    spherePosition = new Vector3(Math.cos(time.secondsElapsedSinceStart) * radius, 1, Math.sin(time.secondsElapsedSinceStart) * radius);
 
        spherePosition.x = spherePosition.x * 0.8;
        spherePosition.z = spherePosition.z * 0.5;
   
    return spherePosition;
}

function rotateSphere(scale, geometry, speed){   
    geometry.worldMatrix.setRotationY(time.secondsElapsedSinceStart * speed);
    geometry.worldMatrix.multiplyRightSide(scale);
}
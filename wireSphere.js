"use strict";

var wireSphere = function() {
var canvas;
var gl;

var numTimesToSubdivide = 3;

var index = 0;

var positionsArray = [];
var normalsArray = [];

var near = -10;
var far = 10;
var radius = 1.5;
var theta = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var left = -2.0;
var right = 2.0;
var top = 2.0;
var bottom = -2.0;

var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

var lightPosition = vec4(1.0, 1.0, 1.0, 1.0); // Front light
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.0, 1.0, 1.0, 1.0);  
var materialDiffuse = vec4(0.0, 1.0, 1.0, 1.0);  
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 80.0;

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

function triangle(a, b, c) {
    positionsArray.push(a);
    positionsArray.push(b);
    positionsArray.push(c);

    normalsArray.push(vec4(a[0], a[1], a[2], 0.0));
    normalsArray.push(vec4(b[0], b[1], b[2], 0.0));
    normalsArray.push(vec4(c[0], c[1], c[2], 0.0));

    index += 3;
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        var ab = normalize(mix(a, b, 0.5), true);
        var ac = normalize(mix(a, c, 0.5), true);
        var bc = normalize(mix(b, c, 0.5), true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle(a, b, c);
    }
}

function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var va = vec4(0.0, 0.0, -1.0, 1.0);
    var vb = vec4(0.0, 0.942809, 0.333333, 1.0);
    var vc = vec4(-0.816497, -0.471405, 0.333333, 1.0);
    var vd = vec4(0.816497, -0.471405, 0.333333, 1.0);

    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), flatten(lightPosition));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightAmbient"), flatten(lightAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightDiffuse"), flatten(lightDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "uLightSpecular"), flatten(lightSpecular));

    gl.uniform4fv(gl.getUniformLocation(program, "uMaterialAmbient"), flatten(materialAmbient));
    gl.uniform4fv(gl.getUniformLocation(program, "uMaterialDiffuse"), flatten(materialDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "uMaterialSpecular"), flatten(materialSpecular));
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);

    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    document.getElementById("Button4").onclick = function() {
        numTimesToSubdivide++;
        index = 0;
        positionsArray = [];
        normalsArray = [];
        init();
    };
    document.getElementById("Button5").onclick = function() {
        if (numTimesToSubdivide) numTimesToSubdivide--;
        index = 0;
        positionsArray = [];
        normalsArray = [];
        init();
    };

    render();
}

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}

function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }

    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    var deltaY = newY - lastMouseY;

    theta += deltaX * 0.01;
    phi += deltaY * 0.01;

    lastMouseX = newX;
    lastMouseY = newY;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, top, near, far);
    normalMatrix = transpose(inverse(modelViewMatrix));

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));

    for (var i = 0; i < index; i += 3)
        gl.drawArrays(gl.TRIANGLES, i, 3);

    requestAnimationFrame(render);
}
}

wireSphere();

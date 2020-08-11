function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

  const image = new Image();
  //image.crossOrigin = "anonymous";

  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;


  return texture;
}

function createRenderTexture(gl, width, height){
	const targetTextureWidth = width;
	const targetTextureHeight = height;
	const targetTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, targetTexture);
	 
	  // define size and format of level 0
	  const level = 0;
	  const internalFormat = gl.RGBA;
	  const border = 0;
	  const format = gl.RGBA;
	  const type = gl.UNSIGNED_BYTE;
	  const data = null;
	  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, targetTextureWidth, targetTextureHeight, border, format, type, data);
	 
	  // set the filtering so we don't need mips
	  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

	  return targetTexture;
}


function createUserBuffer(gl, renderTexture){
	const fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	 
	// attach the texture as the first color attachment
	const attachmentPoint = gl.COLOR_ATTACHMENT0;
	gl.framebufferTexture2D(
	    gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, renderTexture, 0);

	return fb;
}

var InitApp = function () {
	console.log('This is working');

	var canvas = document.getElementById('game-surface');

	let editorMode = false;
	let showRays = false;

	var style = canvas.style;
	style.marginLeft = "auto";
	style.marginRight = "auto";
	var parentStyle = canvas.parentElement.style;
	parentStyle.textAlign = "center";
	parentStyle.width = "100%";





	var button = document.createElement("button");
	button.innerHTML = "Edit Tiles";
	document.body.appendChild(button);
	button.addEventListener ("click", function() {
	  editorMode = !editorMode;

	  if(editorMode){
	  	button.innerHTML = "Start!";
	  }
	  else{
	  	button.innerHTML = "Edit Tiles";
	  }

	});

	var button2 = document.createElement("button");
	button2.innerHTML = "Show Rays";
	document.body.appendChild(button2);
	button2.addEventListener ("click", function() {
		showRays = !showRays;

		if(showRays){
			button2.innerHTML = "Hide Rays";
		}
		else{
			button2.innerHTML = "Show Rays";
		}
	});

	let cellSize = 30;
	let renderMan = new Render(canvas);
    let grid = new Grid(-canvas.width/2, canvas.height/2, cellSize, canvas, renderMan);

    let emitter = new Emitter(0,0, renderMan);
    let obstacles = grid.createEdges();

    let gl = canvas.getContext('webgl');

	let lightTex = loadTexture(gl, 'lightGreen.png');
	gl.bindTexture(gl.TEXTURE_2D, lightTex);

	let renderTo = createRenderTexture(gl, canvas.width, canvas.height);
	let userBuffer = createUserBuffer(gl, renderTo, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	let renderTo2 = createRenderTexture(gl, canvas.width, canvas.height);
	let userBuffer2 = createUserBuffer(gl, renderTo2, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	let renderTo3 = createRenderTexture(gl, canvas.width, canvas.height);
	let userBuffer3 = createUserBuffer(gl, renderTo3, 0);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	
	canvas.addEventListener("mousedown", function(e){
		let pos = getMousePos(grid.canvas, e);
		let x = pos.x - grid.width/2;
    	let y = -pos.y + grid.height/2;
        grid.mouseDown = true;

        grid.rectSelection.x = x;
        grid.rectSelection.y = y;
        grid.rectSelection.width =  1;
        grid.rectSelection.height = 1;

        for(let i = 0; i < grid.gridCells.length; i++){
    		let cell = grid.gridCells[i];
			cell.selected = Collisions.AABB({x : cell.x, y : cell.y, width : cell.size, height : cell.size}, {x : grid.rectSelection.x, y : grid.rectSelection.y, width : grid.rectSelection.width, height : grid.rectSelection.height});
    	}

    }, false);

    canvas.addEventListener("mouseup", function(e){
    	let pos = getMousePos(grid.canvas, e);
		let x = pos.x - grid.width/2;
    	let y = -pos.y + grid.height/2;
        grid.mouseDown = false;

		for(let i = 0; i < grid.gridCells.length; i++){
    		let cell = grid.gridCells[i];

    		if(cell.used == false && cell.selected == true)
    			cell.used = true;
    		else if(cell.used == true && cell.selected == true)
    			cell.used = false;
   
			cell.selected = false;
    	}
        grid.rectSelection = {x : 0, y : 0, width : 0, height : 0};

        obstacles = grid.createEdges();

        emitter.generateRays(obstacles);

    }, false);

	canvas.addEventListener("mousemove", function(e){
		let pos = getMousePos(grid.canvas, e);
		let x = pos.x - grid.width/2;
    	let y = -pos.y + grid.height/2;

    	if(editorMode == false){

    		emitter.pos.x = x;
    		emitter.pos.y = y;
    		emitter.generateRays(obstacles);
    	}
    	else{

	    	grid.rectSelection.width =  x - grid.rectSelection.x;
	        grid.rectSelection.height = grid.rectSelection.y - y;

	    	for(let i = 0; i < grid.gridCells.length; i++){
	    		let cell = grid.gridCells[i];
	    		cell.mouseOver = false;
	    		if(x >= cell.x && x < cell.x + cell.size && y <= cell.y && y > cell.y - cell.size){
	    			cell.mouseOver = true;
	    		}

	    		if(grid.mouseDown){
					cell.selected = Collisions.AABB({x : cell.x, y : cell.y, width : cell.size, height : cell.size}, {x : grid.rectSelection.x, y : grid.rectSelection.y, width : grid.rectSelection.width, height : grid.rectSelection.height});
	    		}
	    	}
    	}
	}, false);

	window.addEventListener('keydown',onKeyDown,false);
	function onKeyDown(e) {
		
		if ( e.code == "Space") {

			if(editorMode == false){
    			emitter.generateRays(obstacles);
			}

			editorMode = true;
		}
	}

	window.addEventListener('keyup',onKeyUp,false);
	function onKeyUp(e) {
		
		if ( e.code == "Space") {
			editorMode = false;
		}
	}

	let flipUniformLocation = gl.getUniformLocation(renderMan.program, 'flipped');
	gl.uniform1i(flipUniformLocation, 0);

	let u_image0Location = gl.getUniformLocation(renderMan.program, "u_texture1");
	let u_image1Location = gl.getUniformLocation(renderMan.program, "u_texture2");

	var angle = 0;
	var loop = function(){
		angle = performance.now() / 1000 / 6 * 2 * Math.PI;
		renderMan.gl.clearColor(0.0, 0.0, 0.0, 1.0);
		renderMan.gl.clear(renderMan.gl.COLOR_BUFFER_BIT | renderMan.gl.DEPTH_BUFFER_BIT);

		let dir = {x : Math.cos(angle),y : Math.sin(angle)};

		emitter.generateRays(obstacles);

		gl.viewport(0, 0, canvas.width, canvas.height);

		if(editorMode == false){
			
			renderMan.gl.clearColor(0.0, 0.0, 0.0, 1.0);
			renderMan.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			renderMan.begin();
			if(showRays){
				emitter.drawRays();
			}
	        
			//grid.drawEdges();
			grid. drawTiles();
			renderMan.end();


			gl.bindFramebuffer(gl.FRAMEBUFFER, userBuffer);
			renderMan.gl.clearColor(0.0, 0.0, 0.0, 1.0);
			renderMan.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.uniform1i(flipUniformLocation, 1);
			renderMan.begin();
			emitter.drawLight();
			renderMan.end();
			

			gl.bindFramebuffer(gl.FRAMEBUFFER, userBuffer2);
			renderMan.gl.clearColor(0.0, 0.0, 0.0, 1.0);
			renderMan.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  			gl.uniform1i(u_image0Location, 0);  
  			gl.uniform1i(u_image1Location, 1); 

  			gl.activeTexture(gl.TEXTURE0);
  			gl.bindTexture(gl.TEXTURE_2D, null);
  			gl.activeTexture(gl.TEXTURE1);
  			gl.bindTexture(gl.TEXTURE_2D, lightTex);
			
  			gl.uniform1i(renderMan.texSampleLocation, 2);
			renderMan.begin();
			renderMan.DrawImage(lightTex, emitter.pos.x - 1024/2, emitter.pos.y + 1024/2, 1024, 1024);
			renderMan.end();
			gl.uniform1i(renderMan.texSampleLocation, 0);
			
			gl.activeTexture(gl.TEXTURE0);
  			gl.bindTexture(gl.TEXTURE_2D, renderTo);
  			gl.activeTexture(gl.TEXTURE1);
  			gl.bindTexture(gl.TEXTURE_2D, renderTo2);

			gl.bindFramebuffer(gl.FRAMEBUFFER, userBuffer3);
			renderMan.gl.clearColor(0.0, 0.0, 0.0, 1.0);
			renderMan.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.uniform1i(renderMan.texSampleLocation, 1);
			renderMan.begin();
			renderMan.DrawImage(renderTo2, -canvas.width/2, canvas.height/2, canvas.width, canvas.height);
			renderMan.end();
			gl.uniform1i(renderMan.texSampleLocation, 0);
			gl.uniform1i(flipUniformLocation, 0);

			gl.activeTexture(gl.TEXTURE0);
  			gl.bindTexture(gl.TEXTURE_2D, null);
  			gl.activeTexture(gl.TEXTURE1);
  			gl.bindTexture(gl.TEXTURE_2D, renderTo3);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.uniform1i(renderMan.texSampleLocation, 2);
			renderMan.begin();
			renderMan.DrawImage(renderTo3, -canvas.width/2, canvas.height/2, canvas.width, canvas.height);
			renderMan.end();
			gl.uniform1i(renderMan.texSampleLocation, 0);


			gl.activeTexture(gl.TEXTURE0);
  			gl.bindTexture(gl.TEXTURE_2D, null);
  			gl.activeTexture(gl.TEXTURE1);
  			gl.bindTexture(gl.TEXTURE_2D, null);
  			
    	}
    	else{

			renderMan.gl.clearColor(0.0, 0.0, 0.0, 1.0);
			renderMan.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
    		renderMan.begin();
    		grid.drawGrid();
    		renderMan.end();
    	}

		requestAnimationFrame(loop);
    }

	requestAnimationFrame(loop);
};






















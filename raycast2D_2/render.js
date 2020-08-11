var vertexShaderText = 
[
'precision mediump float;',
'',
'attribute vec3 vertPosition;',
'attribute vec4 vertColor;',
'attribute vec2 a_texcoord;',
'varying vec4 fragColor;',
'varying vec2 v_texcoord;',
'uniform mat4 mWorld;',
'uniform mat4 mView;',
'uniform mat4 mProj;',
'uniform int flipped;',
'',
'void main()',
'{',
'	fragColor = vertColor;',
'	vec3 flippedPos = vec3(vertPosition.x, -vertPosition.y, vertPosition.z);',
'	if(flipped == 1){gl_Position = mProj * mView * mWorld * vec4(flippedPos, 1.0);}',
'	if(flipped == 0){gl_Position = mProj * mView * mWorld * vec4(vertPosition, 1.0);}',
'	v_texcoord = a_texcoord;',
'}'
].join('\n');

var fragmentShaderText = 
[
'precision mediump float;',
'',
'varying vec4 fragColor;',
'varying vec2 v_texcoord;',
'uniform sampler2D u_texture1;',
'uniform sampler2D u_texture2;',
'uniform int textureSample;',
'',
'void main()',
'{',
	'if(textureSample == 1){',
	'	vec4 colorMask = texture2D(u_texture1, v_texcoord);',
	'	vec4 colorTex = texture2D(u_texture2, v_texcoord);',
	'	if(colorMask.x == 0.0){discard;}',
	'	gl_FragColor = colorTex * colorMask;',
	'}', 
	'else if(textureSample == 2){',
	'	gl_FragColor = texture2D(u_texture2, v_texcoord);',
	'}', 
	'else{',
	'	gl_FragColor = fragColor;',
	'}',
'}'
].join('\n');

var fragmentShaderText2 = 
[
'precision mediump float;',
'',
'varying vec4 fragColor;',
'varying vec2 v_texcoord;',
'uniform sampler2D u_texture;',
'uniform int textureSample;',
'',
'void main()',
'{',
	'if(textureSample == 1){',
	'	gl_FragColor = texture2D(u_texture, v_texcoord);',
	'}', 
	'else{',
	'	gl_FragColor = fragColor;',
	'}',
'}'
].join('\n');


class Render{
	constructor(canvas)
	{
		this.canvas = canvas;
		this.gl = canvas.getContext('webgl');

		if(!this.gl){
			console.log('WebGL not supported, falling back to experimental webGL');
			this.gl = canvas.getContext('experimental-webgl');
		}

		if(!this.gl){
			alert('Your browser does not support WebGL');
		}

		this.gl.clearColor(0.75, 0.85, 0.8, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.gl.enable(this.gl.DEPTH_TEST);
		this.gl.frontFace(this.gl.CCW);
		this.gl.cullFace(this.gl.BACK);
		this.gl.enable(this.gl.BLEND)
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

		//
		// Create shaders
		//
		var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
		var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

		this.gl.shaderSource(vertexShader, vertexShaderText);
		this.gl.shaderSource(fragmentShader, fragmentShaderText);

		this.gl.compileShader(vertexShader);
		if(!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)){
			console.error('ERROR compiling vertex shader!', this.gl.getShaderInfoLog(vertexShader));
			return;
		}

		this.gl.compileShader(fragmentShader);
		if(!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)){
			console.error('ERROR compiling fragment shader!', this.gl.getShaderInfoLog(fragmentShader));
			return;
		}

		var program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);

		if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)){
			console.error('ERROR linking program!', this.gl.getProgramInfoLog(program));
			return;
		}

		//Do in QA mode flag only
		this.gl.validateProgram(program);
		if(!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)){
			console.error('ERROR valdating program!', this.gl.getProgramInfoLog(program));
		}

		this.program = program;

		this.vertices = [];
		this.indices = [];
		this.texcoords = [];

		this.gl.useProgram(this.program);

		this.texSampleLocation = this.gl.getUniformLocation(program, 'textureSample');
		this.gl.uniform1i(this.texSampleLocation, 0);

		var matWorldUniformLocation = this.gl.getUniformLocation(this.program, 'mWorld');
		var matViewUniformLocation = this.gl.getUniformLocation(this.program, 'mView');
		var matProjUniformLocation = this.gl.getUniformLocation(this.program, 'mProj');

		var worldMatrix = new Float32Array(16);
		var viewMatrix = new Float32Array(16);
		var projMatrix = new Float32Array(16);

		glMatrix.mat4.identity(worldMatrix);
		glMatrix.mat4.lookAt(viewMatrix, [0, 0, this.canvas.height/2], [0, 0, 0], [0, 1, 0]);
		glMatrix.mat4.perspective(projMatrix, glMatrix.glMatrix.toRadian(90), this.canvas.width / this.canvas.height, 0.1, 1000.0);

		this.gl.uniformMatrix4fv(matWorldUniformLocation, this.gl.FALSE, worldMatrix);
		this.gl.uniformMatrix4fv(matViewUniformLocation, this.gl.FALSE, viewMatrix);
		this.gl.uniformMatrix4fv(matProjUniformLocation, this.gl.FALSE, projMatrix);
	}

	begin()
	{
		this.gl.useProgram(this.program);
	}

	end()
	{
		var positionAttribLocation = this.gl.getAttribLocation(this.program, 'vertPosition');
		var colorAttribLocation = this.gl.getAttribLocation(this.program, 'vertColor');

		var vertexBufferObject = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBufferObject);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.vertices), this.gl.DYNAMIC_DRAW);

		
		
		this.gl.enableVertexAttribArray(positionAttribLocation);
		this.gl.vertexAttribPointer(
			positionAttribLocation, // Attribute position
			3,
			this.gl.FLOAT, // Type of elements,
			this.gl.FALSE,
			7 * Float32Array.BYTES_PER_ELEMENT,// Size of an individual vertex
			0 // Offset from the beginning of a single vertex to this attribute 
		);

		

		this.gl.enableVertexAttribArray(colorAttribLocation);
		this.gl.vertexAttribPointer(
			colorAttribLocation, // Attribute position
			4,
			this.gl.FLOAT, // Type of elements,
			this.gl.FALSE,
			7 * Float32Array.BYTES_PER_ELEMENT,// Size of an individual vertex
			3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute 
		);

		if(this.texcoords.length > 0){
			var texcoordsAttribLocation = this.gl.getAttribLocation(this.program, 'a_texcoord');

			var texCoordBufferObject = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBufferObject);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.texcoords), this.gl.DYNAMIC_DRAW);

			this.gl.enableVertexAttribArray(texcoordsAttribLocation);
			this.gl.vertexAttribPointer(
				texcoordsAttribLocation, // Attribute position
				2,
				this.gl.FLOAT, // Type of elements,
				this.gl.FALSE,
				2 * Float32Array.BYTES_PER_ELEMENT,// Size of an individual vertex
				0 // Offset from the beginning of a single vertex to this attribute 
			);
		}

		var indexBufferObject = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
		this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), this.gl.DYNAMIC_DRAW); 

		this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.gl.UNSIGNED_SHORT, 0);
	
		this.vertices = [];
		this.indices = [];
		this.texcoords = [];

		this.gl.disableVertexAttribArray(positionAttribLocation);
		this.gl.disableVertexAttribArray(colorAttribLocation);
		this.gl.disableVertexAttribArray(texcoordsAttribLocation);
	}

	DrawLine(x1, y1, x2, y2, sizePx, r, g, b, a)
	{
		let dx = x2 - x1;
		let dy = y2 - y1;

		let mod = Math.sqrt(dy * dy + dx * dx);
		let n1 = {x: -dy/mod, y: dx/mod};
		let n2 = {x: dy/mod, y: -dx/mod};

		let p1 = {x : x1 + n1.x * sizePx/2 , y : y1 + n1.y * sizePx/2};
		let p2 = {x : x1 + n2.x * sizePx/2 , y : y1 + n2.y * sizePx/2};
		let p3 = {x : x2 + n1.x * sizePx/2 , y : y2 + n1.y * sizePx/2};
		let p4 = {x : x2 + n2.x * sizePx/2 , y : y2 + n2.y * sizePx/2};

		let vertices = 
		[
			p1.x, p1.y, 0.0,  r, g, b, a,
			p2.x, p2.y, 0.0,  r, g, b, a,	
			p3.x, p3.y, 0.0,  r, g, b, a,
			p4.x, p4.y, 0.0,  r, g, b, a
		];

		for(let i = 0; i < vertices.length; i++){
			this.vertices.push(vertices[i]);
		}

		let indices = 
		[
			0 + 4*this.indices.length/6, 1 + 4*this.indices.length/6, 2 + 4*this.indices.length/6,
			2 + 4*this.indices.length/6, 1 + 4*this.indices.length/6, 3 + 4*this.indices.length/6
		];

		for(let i = 0; i < indices.length; i++){
			this.indices.push(indices[i]);
		}
	}

	DrawRect(x, y, width, height, r, g, b, a)
	{
		let p1 = {x : x, y : y};
		let p2 = {x : x + width, y : y};
		let p3 = {x : x + width , y : y - height};
		let p4 = {x : x , y : y - height};

		let vertices = 
		[
			p1.x, p1.y, 0.0,  r, g, b, a,
			p2.x, p2.y, 0.0,  r, g, b, a,	
			p3.x, p3.y, 0.0,  r, g, b, a,
			p4.x, p4.y, 0.0,  r, g, b, a
		];

		for(let i = 0; i < vertices.length; i++){
			this.vertices.push(vertices[i]);
		}

		let indices = 
		[
			0 + 4*this.indices.length/6, 1 + 4*this.indices.length/6, 2 + 4*this.indices.length/6,
			2 + 4*this.indices.length/6, 3 + 4*this.indices.length/6, 0 + 4*this.indices.length/6
		];

		for(let i = 0; i < indices.length; i++){
			this.indices.push(indices[i]);
		}
	}

	DrawImage(tex, x, y, width, height){

		this.DrawRect(x, y, width, height, 0, 1, 0, 1);

		  let texcoords = [
		    0, 0,
		    1, 0,
		    1, 1,
		    0, 1
		  ];

		for(let i = 0; i < texcoords.length; i++){
			this.texcoords.push(texcoords[i]);
		}
	}

	DrawTriangle(pt1, pt2, pt3, r, g, b, a1, a2, a3)
	{
		let vertices = 
		[
			pt1.x, pt1.y, 0.0,  r, g, b, a1,
			pt2.x, pt2.y, 0.0,  r, g, b, a2,	
			pt3.x, pt3.y, 0.0,  r, g, b, a3
		];

		for(let i = 0; i < vertices.length; i++){
			this.vertices.push(vertices[i]);
		}

		let indices = 
		[
			0 + this.indices.length, 1 + this.indices.length, 2 + this.indices.length
		];

		for(let i = 0; i < indices.length; i++){
			this.indices.push(indices[i]);
		}
	}

	DrawFan(points){

		for(let i = 0; i < points.length; i++){
			this.vertices.push(points[i].x);
			this.vertices.push(points[i].y);
			this.vertices.push(0.0);

			this.vertices.push(1);
			this.vertices.push(1);
			this.vertices.push(1);
			this.vertices.push(1);
		}
	}
}






















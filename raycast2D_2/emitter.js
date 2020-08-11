class Ray{
	constructor(posStart, posEnd)
	{
		this.posStart = posStart;
		this.posEnd = posEnd;
		this.size = 2;

		this.r = 1.0;
		this.g = 1.0;
		this.b = 1.0;
		this.a = 1.0;

		this.points = [];

		this.isExtra = false;
	}

	getNeighbourRays(){
		let ray1 = new Ray(this.posStart, this.posEnd);
		let ray2 = new Ray(this.posStart, this.posEnd);

		ray1.isExtra = true;
		ray2.isExtra = true;

		let length = 10000; 

		var baseAngle = Math.atan2(this.posEnd.y - this.posStart.y, this.posEnd.x - this.posStart.x);

		var angleRay1 = baseAngle + 0.00001;
		var angleRay2 = baseAngle - 0.00001;

		ray1.posEnd = {x: ray1.posStart.x + Math.cos(angleRay1) * length, y : ray1.posStart.y + Math.sin(angleRay1) * length};
		ray2.posEnd = {x:ray2.posStart.x + Math.cos(angleRay2) * length, y : ray2.posStart.y + Math.sin(angleRay2) * length};

		return {r1: ray1, r2: ray2};
	}
}

class Emitter{
	constructor(posx, posy,renderMan)
	{
		this.pos = {x : posx, y : posy};
		this.renderMan = renderMan;
		this.rays = [];

		this.pointsOnEdges = [];

		this.rayLength = 200;

		this.r = 1.0;
		this.g = 1.0;
		this.b = 1.0;
		this.a = 1.0;
	}

	drawRays(){ 

        for(let i = 0; i < this.pointsOnEdges.length; i++){
        	let pt = this.pointsOnEdges[i];
        	let ptSize = 5;
        	let lineSize = 2; 

        	this.renderMan.DrawLine(this.pos.x, this.pos.y, pt.x, pt.y, lineSize, 1, 0, 0, 1);   

        	this.renderMan.DrawRect(pt.x - ptSize / 2, pt.y + ptSize / 2, ptSize, ptSize, 0, 0, 1, 1);
        }
	}

	drawLight(){

		for(let i = 0; i < this.pointsOnEdges.length-1; i++){

			/*let dxA = this.pointsOnEdges[i].x - this.pos.x;
			let dyA = this.pointsOnEdges[i].y - this.pos.y;
			let distA = Math.sqrt(dyA * dyA + dxA * dxA);

			let dxB = this.pointsOnEdges[i+1].x - this.pos.x;
			let dyB = this.pointsOnEdges[i+1].y - this.pos.y;
			let distB = Math.sqrt(dyB * dyB + dxB * dxB); 

			this.renderMan.DrawTriangle(this.pos, this.pointsOnEdges[i], this.pointsOnEdges[i+1], 1,1,1, 1.0, this.rayLength / distA, this.rayLength / distB);
			*/
			this.renderMan.DrawTriangle(this.pos, this.pointsOnEdges[i], this.pointsOnEdges[i+1], 1,1,1, 1.0, 1.0, 1.0);
		}

		/*let dxA = this.pointsOnEdges[this.pointsOnEdges.length-1].x - this.pos.x;
		let dyA = this.pointsOnEdges[this.pointsOnEdges.length-1].y - this.pos.y;
		let distA = Math.sqrt(dyA * dyA + dxA * dxA);

		let dxB = this.pointsOnEdges[0].x - this.pos.x;
		let dyB = this.pointsOnEdges[0].y - this.pos.y;
		let distB = Math.sqrt(dyB * dyB + dxB * dxB); 

		this.renderMan.DrawTriangle(this.pos, this.pointsOnEdges[this.pointsOnEdges.length-1], this.pointsOnEdges[0], 1,1,1, 1.0, this.rayLength / distA, this.rayLength / distB);
		*/
		this.renderMan.DrawTriangle(this.pos, this.pointsOnEdges[this.pointsOnEdges.length-1], this.pointsOnEdges[0], 1,1,1, 1.0, 1.0, 1.0);
	}

	generateRays(edges){
		this.rays = [];
		
		// Cast all rays from each edge vertex to the emitter
		for(let i = 0; i < edges.length; i++){
			let edgeP1 = edges[i].p1;
			let edgeP2 = edges[i].p2;
			

			let ray1 = new Ray(this.pos, edgeP1);
			let ray2 = new Ray(this.pos, edgeP2);

			// Don't add duplicate rays
			let containsP1 = false;
			for(let i = 0; i < this.rays.length; i++){
				let ray = this.rays[i];
				if(ray.posEnd.x == edgeP1.x && ray.posEnd.y == edgeP1.y)
					containsP1 = true;
			}

			if(containsP1 == false)
			{
				this.rays.push(ray1);

				// Adde the neighbour rays (hack to cast rays outside polypon shape/perimeter)
				let extraRays = ray1.getNeighbourRays();
				this.rays.push(extraRays.r1);
				this.rays.push(extraRays.r2);
			}

			// Don't add duplicate rays
			let containsP2 = false;
			for(let i = 0; i < this.rays.length; i++){
				let ray = this.rays[i];
				if(ray.posEnd.x == edgeP2.x && ray.posEnd.y == edgeP2.y)
					containsP2 = true;
			}

			if(containsP2 == false){
				this.rays.push(ray2);

				// Adde the neighbour rays (hack to cast rays outside polypon shape/perimeter)
				let extraRays = ray2.getNeighbourRays();
				this.rays.push(extraRays.r1);
				this.rays.push(extraRays.r2);
			}
		}


		// Get all points of collision between a ray and an edge
		this.rays.forEach(function(ray, index, object) {
			ray.points = [];

			for(let j = 0; j < edges.length; j++){

				let pt = Collisions.RayEdge(ray, edges[j]);

				if(pt != null){
					let containsPt = false;
					for(let i = 0; i < ray.points.length; i++){
						let point = ray.points[i];
						if(point.x == pt.x && point.y == pt.y)
							containsPt = true;
					}

					if(containsPt == false)
						ray.points.push(pt);
				}
			}
		});

		let emitter = this;
		// Sort all collision points, from the closest to the emitter position
		this.pointsOnEdges = [];
		this.rays.forEach(function(ray, index, object) {
			
			if(ray.points.length > 1){
				ray.points.sort(function(a,b){

					let dxA = a.x - emitter.pos.x;
					let dyA = a.y - emitter.pos.y;
					let distA = Math.sqrt(dyA * dyA + dxA * dxA);

					let dxB = b.x - emitter.pos.x;
					let dyB = b.y - emitter.pos.y;
					let distB = Math.sqrt(dyB * dyB + dxB * dxB);

					return (distA < distB ? -1 : 1);
				});
			}

			if(ray.points.length > 0)
			{
				ray.posEnd = ray.points[0];
			}

			// Don't add similar end points
			let similar = false;
			let similarityFactor = 2;
			for(let i = 0; i < emitter.pointsOnEdges.length; i++){
				let pt = emitter.pointsOnEdges[i];

				if(ray.posEnd.x > pt.x - similarityFactor && ray.posEnd.x < pt.x + similarityFactor && ray.posEnd.y > pt.y - similarityFactor && ray.posEnd.y < pt.y + similarityFactor){
					similar = true;
					break;
				}
			}

			if(similar == false){
				emitter.pointsOnEdges.push(ray.posEnd);
			}
		});

		// Sort all points in circular order around the emitter position
		this.pointsOnEdges.sort(function(a,b){

			var angleA = Math.atan2(a.y - emitter.pos.y, a.x - emitter.pos.x);
			var angleB = Math.atan2(b.y - emitter.pos.y, b.x - emitter.pos.x);

			return (angleA < angleB ? -1 : 1);
		});
	}
}
























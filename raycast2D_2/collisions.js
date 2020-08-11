var Collisions = 
{
	LineSegment : function(line, segment){

	    const x1 = segment.x1;
	    const y1 = segment.y1;
	    const x2 = segment.x2;
	    const y2 = segment.y2;

	    const x3 = line.pos.x;
	    const y3 = line.pos.y;
	    const x4 = line.pos.x + line.dir.x;
	    const y4 = line.pos.y + line.dir.y;

	    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
	    if (den == 0) {
	      return null;
	    }

	    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
	    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

	    if (t > 0 && t < 1 && u > 0) {
	      const pt = {x: x1 + t * (x2 - x1), y : y1 + t * (y2 - y1)};
	      return pt;
	    } else {
	      return null;
	    }
	},

	RayEdge : function(ray, edge){

	    const x1 = ray.posStart.x;
	    const y1 = ray.posStart.y;
	    const x2 = ray.posEnd.x;
	    const y2 = ray.posEnd.y;

	    const x3 = edge.p1.x;
	    const y3 = edge.p1.y;
	    const x4 = edge.p2.x;
	    const y4 = edge.p2.y;

	    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
	    if (den == 0) {
	      return null;
	    }

	    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
	    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

	    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
	      const pt = {x: x1 + t * (x2 - x1), y : y1 + t * (y2 - y1)};
	      return pt;
	    } else {
	      return null;
	    }
	},

	AABB : function(box1, box2){

		if(box1.width < 0){
			box1.width = Math.abs(box1.width);
			box1.x = box1.x - box1.width;
		}

		if(box1.height < 0){
			box1.height = Math.abs(box1.height);
			box1.y = box1.y + box1.height;
		}

		if(box2.width < 0){
			box2.width = Math.abs(box2.width);
			box2.x = box2.x - box2.width;
		}

		if(box2.height < 0){
			box2.height = Math.abs(box2.height);
			box2.y = box2.y + box2.height;
		}


		if(box1.x > (box2.x + box2.width)) return false; // box1 is too far right, no collision
		else if((box1.x + box1.width) < box2.x) return false; // box1 is too far left, no collision
		else if(box1.y < (box2.y - box2.height)) return false; // box1 is too far down, no collision
		else if((box1.y - box1.height) > box2.y) return false; // box1 is too far up, no collision
		else return true; // there is a collision
		
	}
};
























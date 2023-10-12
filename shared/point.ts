export class Point {
	constructor(
		public latitude: number,
		public longitude: number
	) {}

	static from(points) {
		return new Point(points.latitude, points.longitude);
	}

	walk(angle: number, distance: number) {
		if (angle === null) {
			return new Point(this.latitude, this.longitude);
		}
	
		const earthRadius = 6371; // kilometers
		const latitudeRadiants = this.latitude * (Math.PI / 180);
		const longitudeRadiants = this.longitude * (Math.PI / 180);
	
		// convert latitude and longitude to cartesian coordinates
		const x = earthRadius * Math.cos(latitudeRadiants) * longitudeRadiants;
		const y = earthRadius * latitudeRadiants;
	
		// calculate the destination cartesian coordinates
		const targetX = x - (distance / earthRadius) * Math.cos(angle);
		const targetY = y - (distance / earthRadius) * Math.sin(angle);
	
		// convert destination cartesian coordinates back to latitude and longitude
		const targetLatitude = (targetY / earthRadius) * (180 / Math.PI);
		const targetLongitude = (targetX / (earthRadius * Math.cos(latitudeRadiants))) * (180 / Math.PI);
	
		return new Point(targetLatitude, targetLongitude);
	}

	clone() {
		return new Point(this.latitude, this.longitude);
	}
}
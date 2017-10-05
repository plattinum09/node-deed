/* โหลด Express มาใช้งาน */
const app = require('express')()
const port = process.env.PORT || 5001
const osmosis = require('osmosis')
const mongoose = require('mongoose')


// connect mongo
mongoose.connect('mongodb://admin:tecmove1@52.187.59.37:27017/admin', { useMongoClient: true, promiseLibrary: global.Promise });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('connect mongo success')
});

const deed_mongo = mongoose.model('deed',{
	branch:String,
	theperiod:String,
	costappraisal:String,
	area:String,
	deedno:String,
	survey: String,
	place: String,
	UTM: String,
	map: String,
	landnumber: String,
	tumbol: String,
	scale: String,
	landid: String,
	changwat: String,
	amphur: String,
});

const deed_mongo_undefined = mongoose.model('deed_undefined',{
	landid: String,
	changwat: String,
	amphur: String,
});
let i_chanode 		= 0;
let i_changwat 		= 16;
const limit_changwat = 17;

function crawlerDeed() {
	osmosis
		.post('http://property.treasury.go.th/pvmwebsite/search_data/s_land1_result.asp', {
		  chanode_no: `${i_chanode}`,
		  selChangwat: `${i_changwat}`
	 	})
		.set({
		    'numPage':  '.style6',
		})
	  	.data(function(page) {
		const num = Math.ceil(parseInt(page['numPage'])/20)
		console.log(i_chanode,page)
		
		for (let i = 1; i <= num; i++) {
		 	osmosis
		 	.post('http://property.treasury.go.th/pvmwebsite/search_data/s_land1_result.asp', {
		 		chanode_no: i_chanode,
	  			selChangwat: i_changwat,
	  			page: i 
		 	}).set({
		 		'link':  ['.table !> a@onclick'],
		 	}).data(function(url) {
			let Url = url['link'][1]
		 	if (Url !== undefined) {
				// console.log(Url,i,num)
	 			Url = Url.replace('LandReport(', '')
	 			Url = Url.replace("'", '')
	 			Url = Url.replace("','720','570');", '')
	 			Url = Url.split(',')
 				osmosis
			  	 	.get(`http://property.treasury.go.th/pvmwebsite/search_data/r_land_price.asp?landid=${Url[0]}&changwat=${Url[1]}&amphur=${Url[2]}`)
			  	 	.set({
			  	 		'branch': 'b[2]',
			  	 		'theperiod': 'b[3]',
			  	 		'costappraisal': 'tr[10] > td[4] > b',
			  	 		'area' : 'tr[9] > td[4]',
			  	 		'deedno' : 'tr[3] > td[4]',
			  	 		'survey' : 'tr[4] > td[4]',
			  	 		'place' : 'tr[6] > td[2]',
			  	 		'UTM' : 'tr[6] > td[3]',
			  	 		'map' : 'tr[6] > td[5]',
			  	 		'landnumber' : 'tr[6] > td[9]',
			  	 		'tumbol' : 'tr[4] > td[6]',
			  	 		'scale' : 'tr[6] > td[7]'
			  	 	}).data(function(deed) {
			  	 		if (isEmpty(deed) ) {
			  	 			const deedObj = new deed_mongo_undefined({
			  	 				landid:Url[0],
			  	 				changwat:Url[1],
			  	 				amphur:Url[2]
			  	 			})
			  	 			deedObj.save()
			  	 		}else{
			  	 			let objdeed = deed
			  	 			objdeed['landid'] = Url[0]
			  	 			objdeed['changwat'] = Url[1]
			  	 			objdeed['amphur'] = Url[2]
			  	 			const newObj = new deed_mongo(deed)	
			  	 			newObj.save()
			  	 			console.log(deed)
			  	 		}
			  	 	})
		 		}
		 	}

		 			

		 		
		 	})
		}
		if (i_chanode <= 1 && i_changwat <= limit_changwat ) {
			setTimeout(() => {
				i_chanode++
				crawlerDeed()
			}, 100)
		}else if (i_chanode > 1 && i_changwat <= limit_changwat) {
			i_chanode = 0
			i_changwat++
			crawlerDeed()
		}else{
			console.log('finish')
		}
		console.log(i_chanode)
	})
	  	
}
crawlerDeed()

function isEmpty(obj) {
  return !Object.keys(obj).length > 0;
}

/* สั่งให้ server ทำการรัน Web Server ด้วย port ที่เรากำหนด */
app.listen(port, function() {
    console.log('Starting node.js on port ' + port);
});
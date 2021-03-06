/* โหลด Express มาใช้งาน */
const app = require('express')()
const port = process.env.PORT || 5005
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
let i_changwat 		= 10;
const limit_changwat = 11;
const limit_chanode  = 200000;
let done;

const crawlerDeed = async () => {
	osmosis
		.post('http://property.treasury.go.th/pvmwebsite/search_data/s_land1_result.asp', {
		  chanode_no: `${i_chanode}`,
		  selChangwat: `${i_changwat}`
	 	})
		.set({
		    'numPage':  '.style6',
		})
	  	.data(function(page) {
		const page_num = parseInt(page['numPage'])
		const num = Math.ceil(page_num/20)
		// console.log(i_changwat+"i"+i_chanode,page,num)
		done = 1
		if (page_num == 0) {
			if (0 == page_num && i_chanode <= limit_chanode && i_changwat <= limit_changwat ) {
					i_chanode++
					crawlerDeed()
				    console.log('i_chanode >>>>>>>>>>>>>>>>')
			}else if (0 == page_num && i_chanode > limit_chanode && i_changwat <= limit_changwat) {
				i_chanode = 0
				i_changwat++
					crawlerDeed()
					console.log('new i_changwat >>>>>>>>>>> ')
			}
		}else{
			option_deed(1,num,page_num)
		}
		// console.log(i_changwat,i_chanode,done)
	})
}
crawlerDeed()

//ผิด
const option_deed = async (iPage,num,page_num)=>{
osmosis
 	.post('http://property.treasury.go.th/pvmwebsite/search_data/s_land1_result.asp', {
 			chanode_no: i_chanode,
			selChangwat: i_changwat,
			page: iPage 
 	})
 	.set({
 		'link':  ['.table !> a@onclick'],
 	}).data(function(url) {
	for (let numlink in url['link']) {
		let Url = url['link'][numlink]
		if (Url.indexOf('LandReport(') > -1) {
			if (Url !== undefined && Url.indexOf('LandReport(') > -1) {
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
			  	 		}
			  	 		console.log(done+":"+page_num,deed)
			  	 	}).then(function(argument) {
						// console.log(done,page_num,limit_chanode)
			  		  	if (done == page_num && i_chanode < limit_chanode && i_changwat <= limit_changwat ) {
				  		  	i_chanode++
							crawlerDeed()
							console.log('i_chanode >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
						}else if (done == page_num && i_chanode > limit_chanode && i_changwat <= limit_changwat) {
							i_chanode = 0
							i_changwat++
							crawlerDeed()
							console.log('new i_changwat >>>>>>>>>>>>>>>>>>>>>>>>>>>>>'+i_changwat+'='+limit_changwat)
						}else if(done == page_num && i_changwat == limit_changwat){
							console.log('success')
						}
			  	 		done++
			  	 	})
		 		}
		 		
			}
			
		}
 	}).then(function() {
		if (iPage <= num) {
 			iPage++
			option_deed(iPage,num,page_num)
		}
 	})
}


function isEmpty(obj) {
  return !Object.keys(obj).length > 0;
}

/* สั่งให้ server ทำการรัน Web Server ด้วย port ที่เรากำหนด */
app.listen(port, function() {
    console.log('Starting node.js on port ' + port);
});
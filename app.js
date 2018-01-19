var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
var fs = require("fs");
server.listen(process.env.PORT || 3000);
app.get("/",function(req,res){
	res.sendFile(__dirname + "/index.html");
});
app.get("/img/:namepic",function(req,res){
var i = req.params.namepic;
	res.sendFile(__dirname + "/images/"+i);
});
var usernameArr = [];

var ketqua;

//connect database
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "himochat"
});
function getFilenameImage(id){
var date = new Date();
var milis = date.getTime();
return "images/"+id.substring(2)+milis+".png";
}
con.connect(function(err) {
  if (err) throw err;
  console.log("Mysql was Connected!");
});

io.sockets.on('connection',function(socket){
		console.log("Co nguoi connect");


		//--Dang ky tai khoan
		socket.on('client_Dang_ky_thanhvien',function(data){
			data = JSON.parse(data);
		 	 console.log("client: đăng ký tài khoản tên: "+data.username);

		 	var query="SELECT  Count(ID) as SL    FROM users where Username='"+data.username+"'";
		  	//console.log(query);
		    con.query(query, function (err, result, fields) {
			    if (err) throw err;
			    if(result[0].SL >0){
					ketqua=false;
					
				}
				else{
						
					var query="INSERT INTO `users`(`Username`, `Password`) VALUES ('"+data.username+"','"+data.password+"')";
					 console.log(query);
					var query2="INSERT INTO `profile`( `Username`) VALUES ('"+data.username+"')";
					 console.log(query2);
			  		con.query(query, function (err, result, fields) {
			  		if (err) throw err;
			  			con.query(query2, function (err, result, fields) {
			  			if (err) throw err;
			  			ketqua=true;
			 			console.log(ketqua);
						});
					
					

					});
			  		};
			  		socket.emit('ketquaDK',{noidung:ketqua});
			});
		});//--Dang ky tai khoan

		//Dang nhap
		socket.on('client-gui-username',function(data){
			data = JSON.parse(data);
		 	var query="SELECT ID  , Username  FROM users where Username='"+data.username+"' and "+"Password ='"+data.password+"'";
		  console.log("Client username: "+data.username+" gửi thông tin đăng nhập." );
		    con.query(query, function (err, result, fields) {
		   		 if (err) throw err;
		   		 if(result.length >0){
					ketqua=true;
					socket.un = result[0].ID ;

				
					}
				  else
				 {
					ketqua=false;
				 }
				socket.emit('ketquaDN',{noidung:ketqua});

			});
		});//Dangnhap

		//Lay danh sach ban be
		socket.on('client_xin_thong_tin_friendlist',function(data){
			data = JSON.parse(data);
			console.log("Client "+data.username+ " xin danh sách friend ");
			var query="SELECT * FROM `profile` WHERE  profile.Username IN";
		        query+="( select"; 
		        query+="(SELECT friend_relationship.user as Friend from friend_relationship WHERE  friend_relationship.relation ='"+data.username+"')"; 
		 		query+="Union";
		 		query+="(SELECT friend_relationship.relation  as Friend from friend_relationship WHERE friend_relationship.user ='"+data.username+"') )";
			     con.query(query, function (err, result, fields) {
		   		 if (err) throw err;
		   		 console.log(result);	   		
		   		if(result.length >0)
		   		 socket.emit('server_return_friendlist', {danhsach: result});
				});
		});//Lay danh sach ban be

		//Lay du lieu khoi tao ***** chưa dùng
		socket.on('client_xin_thong_tin_KhoiTao',function(data){
			data = JSON.parse(data);
			var query ="SELECT count(ID) as SoLuong FROM `messages` WHERE messages.to='"+data.username+"' and messages.status=0";
				
			     con.query(query, function (err, result, fields) {
		   		 if (err) throw err;
		   		 console.log(result);	   		
		   		 socket.emit('server_return_num_of_new_message', {Number: result});
				});
		});//Lay du lieu khoi tao

		//Lay du lieu tin nhan
		socket.on('client_xin_thong_tin_tin_nhan_voi_friend',function(data){
			data = JSON.parse(data);
			console.log("Client "+data.username+ "xin tin tất cả tin nhắn với "+data.friend);
			//	console.log(data.username);
			//	console.log(data.friend);

			var query ="SELECT * FROM `messages`  WHERE (messages.to='"+data.username+"' or messages.to='"+data.friend+"') and  (messages.from='"+data.username+"' or messages.from='"+data.friend+"') ";
			//		 console.log(query);
			     con.query(query, function (err, result, fields) {
		   		 if (err) throw err;
			//   	 console.log(result);	   		
		   		 socket.emit('server_return_listmesage', {listmesage: result});
				});
		});//Lay du lieu tin nhan

		 //Lay du lieu tin nhan moi
		socket.on('client_xin_thong_tin_tin_nhanmoi_voi_friend',function(data){
			data = JSON.parse(data);
			console.log("Client "+data.username +" xin tin nhắn mới với "+data.friend)
			//	console.log(data.username);
			//	console.log(data.friend);
			//	console.log(data.ID);
			var query ="SELECT count(ID) as SL FROM `messages`  WHERE   messages.ID >"+data.ID;
			//	console.log(query);
			con.query(query, function (err, result, fields) {
		   		 if (err) throw err;
		   		  if(result[0].SL >0){
					var query ="SELECT * FROM `messages`  WHERE messages.ID >'"+data.ID+"' and (messages.to='"+data.username+"' or messages.to='"+data.friend+"') and  (messages.from='"+data.username+"' or messages.from='"+data.friend+"') ";
					con.query(query, function (err, result, fields) {
		   				 if (err) throw err;
		   				 if(result.length >0)
		   				 socket.emit('server_return_listmesage', {listmesage: result});
		   				

		   			});
				}
			});
		});//Lay du lieu tin nhan moi


		//client gui tin nhan cho friend
		socket.on('client_gui_tin_nhan_cho_friend',function(data){
				data = JSON.parse(data);
				//console.log(data.username);
				//console.log(data.friend);
				//console.log(data.content);
				console.log("Client "+data.username +" gui tin nhắn mới tới "+data.friend)
				var query ="INSERT INTO `messages`(`from`, `to`, `content`) VALUES ('"+data.username+"','"+data.friend+"','"+data.content+"')";
				// console.log(query);
			     con.query(query, function (err, result, fields) {
		   		 if (err) throw err;		   	  	
				});
		});//client gui tin nhan cho friend

		//client replay da nhan tin nhan
		socket.on('client_gui_da_nhan_tin_nhan_tu_friend',function(data){
				data = JSON.parse(data);
				//console.log(data.username);
				//console.log(data.friend);
				//console.log(data.content);
				var query ="Call checkRead ('"+data.ID+"',@t)";
				// console.log(query);
			     con.query(query, function (err, result, fields) {
		   		 if (err) throw err;		   	  	
				});
		});	//client replay da nhan tin nhan





       //clientGuiAnh
       socket.on('Client_gui_stt',function(data){
            console.log("Client gui stt");
            data = JSON.parse(data);
            console.log(data);
             var filename="" ;
             var Username ="";
             var Post;
             var SoLuongPost=0;
             var LinkIMG="";
             var KetQua=0;
             Username =data.username ;
             Post = data.post;
             var query ="SELECT COUNT(status.ID) as soLuong  FROM `status` WHERE Username = '"+Username+"'";
             con.query(query, function (err, result, fields) {
                 if (err) throw err;
                 SoLuongPost=result[0].soLuong;
                 if(data.pic == 1){
                        socket.emit('Server_lay_img',{noidung:data.pic});
                        socket.on('Client_gui_hinh',function(data){
                            filename =getFilenameImage(socket.id);
                            fs.writeFile(filename,data);
                            LinkIMG ="localhost:3000/img/"+filename.split('/')[1];
                            query ="INSERT INTO `status`(`Post`, `Img`, `Username`) values('"+Post+"','"+LinkIMG+"','"+Username+"') ";
                            con.query(query, function (err, result, fields) {
                                if (err) throw err;
                                query ="SELECT COUNT(status.ID) as soLuong  FROM `status` WHERE Username = '"+Username+"'";
                                con.query(query, function (err, result, fields) {
                                    if (err) throw err;
                                    if(result[0].soLuong >SoLuongPost){
                                        KetQua=1;
                                        }

                                    socket.emit("Server_bao_ketQua",{ketqua:KetQua});
                                });
                            });
                        });
                   }
                   else
                   {
                        query ="INSERT INTO `status`(`Post`, `Username`) values('"+Post+"','"+Username+"') ";
                        con.query(query, function (err, result, fields) {
                            if (err) throw err;
                            query ="SELECT COUNT(status.ID) as soLuong  FROM `status` WHERE Username = '"+Username+"'";
                            con.query(query, function (err, result, fields) {
                                if (err) throw err;
                                if(result[0].soLuong >SoLuongPost){
                                    KetQua=1;
                                }
                                 console.log(result[0].soLuong+">"+SoLuongPost )
                            socket.emit("Server_bao_ketQua",{ketqua:KetQua});
                            });
                        });
                   }
                 });
       }); //clientGuiAnh


});

		
		
			

		   

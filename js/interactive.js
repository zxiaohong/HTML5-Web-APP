/**
 * Created by Eva on 16/6/14.
 */
(function(){
		  "use strict";
		  var Util=(function(){
					var prefix="html5_reader_";
					var StorageGetter=function(key){
							  return localStorage.getItem(prefix+key);
					};
					var StorageSetter=function(key,val){
							  return localStorage.setItem(prefix+key,val);
					};
					var getBSONP = function(url,callback){
							  return $.jsonp({
										url:url,
										cache:true,
										callback:'duokan_fiction_chapter',
										
										success:function(result){
												  //debugger
												  var data=$.base64.decode(result);
												  var json = decodeURIComponent(escape(data));
												  callback(json);
										}
							  })
					};
					return{
							  getBSONP:getBSONP,
							  StorageGetter:StorageGetter,
							  StorageSetter:StorageSetter
					}
		  })();
		  
		  
		  var Win=$(window);
		  var Doc=$(document);
		  var Dom={
					top_bar:$(".top-bar"),
					bottom_nav:$(".bottom_nav"),
					font_menu:$("#font-menu"),
					bottom_nav_panel:$(".bottom_nav_panel"),
					icon_fonts:$("#icon_fonts"),
					Body:$("body")
		  };
		  var ReaderInteractive;
		  var ReaderUI;
		  
		  //获得初始背景颜色；
		  var initialBkg = Util.StorageGetter("bkg_class") ? Util.StorageGetter("bkg_class") : Util.StorageSetter("bkg_class","lightyellow");
		  console.log(initialBkg);
		  Dom.Body.addClass(initialBkg);
		  
		  //入口函数   
		  function main(){
					//数据交互     
					ReaderInteractive = readerInteractive();
					ReaderUI = readerBaseFrame($(".container"));
					ReaderInteractive.init(function(data){
							  ReaderUI(data);
					});
					//前端交互效果   
					EventHandler();
		  }
		  main();
		  
		  // 实现和阅读器相关的数据交互的方法	        
		  function readerInteractive(){
					var i = Util.StorageGetter("page_num") ? Util.StorageGetter("page_num") : Util.StorageSetter("page_num",1);
					console.log(i);
					var Chapter_id;
					var ChapterTotal;
					//章节和内容的初始化函数
					var init = function(UIcallback){
							  
							  // getFictionInfo(function(){
							  //     getCurChapterContent(Chapter_id,function(data){
							  //         //TODO 
							  //         UIcallback && UIcallback(data);    
							  //     })
							  // })
							  getFictionInfoPromise().then(function(d){
										return  getCurChapterContentPromise();
							  }).then(function(data){
										UIcallback && UIcallback(data);
							  });
					};
					//获得章节信息；
					var getFictionInfoPromise = function(){
							  return new Promise(function(resolve,reject){
										$.get("data/chapter.json",function(data){
												  if (data.result==0){
															//获得章节信息之后的回调
															Chapter_id = data.chapters[i].chapter_id;
															ChapterTotal = data.chapters.length;
															resolve();
												  }else{
															reject();
												  }
										},"json")
							  });
					};
					/*var getFictionInfo = function(callback,data){
					 $.get("data/chapter.json",function(data){
					 //获得章节信息之后的回调
					 Chapter_id = data.chapters[i].chapter_id;
					 ChapterTotal = data.chapters.length;
					 callback && callback();
					 
					 },"json")
					 }*/
					
					// 获得章节内容
					var getCurChapterContentPromise = function(){
							  return new Promise(function(resolve,reject){
										$.get('data/data'+Chapter_id+'.json',function(data){
												  if(data.result == 0){
															var url = data.jsonp;
															Util.getBSONP(url,function(data){
																	  // callback && callback(data);
																	  resolve(data);
															})
												  }else{
															reject({msg:'fail'});
												  }
										},"json");
							  })
					} ;
					/* var getCurChapterContent = function(chapter_id,callback){
					 $.get('data/data'+chapter_id+'.json',function(data){
					 if(data.result == 0){
					 var url = data.jsonp;
					 Util.getBSONP(url,function(data){
					 callback && callback(data);
					 })
					 }
					 },"json");
					 }*/
					var prevChapter = function(UIcallback){
							  Chapter_id = parseInt(Chapter_id);
							  if(Chapter_id == 0 ){
										return;
							  }
							  Chapter_id -= 1;
							  getCurChapterContent(Chapter_id,UIcallback);
							  Util.StorageSetter("page_num",Chapter_id);
					};
					var nextChapter = function(UIcallback){
							  Chapter_id = parseInt(Chapter_id);
							  ChapterTotal = parseInt(ChapterTotal);
							  if (Chapter_id == ChapterTotal-1){
										return;
							  }
							  Chapter_id += 1;
							  getCurChapterContent(Chapter_id,UIcallback);
							  Util.StorageSetter("page_num",Chapter_id);
					};
					
					return {
							  init:init,
							  prevChapter:prevChapter,
							  nextChapter:nextChapter
					}
		  }
		  
		  //todo 渲染基本的UI结构          
		  function readerBaseFrame(container){
					//解析章节信息
					function parseChapterData(jsonData){
							  var jsonObj = JSON.parse(jsonData);
							  var html = '<h4>'+jsonObj.t+'</h4>';
							  for(var i = 0 ; i<jsonObj.p.length;i++){
										html += '<p>'+jsonObj.p[i]+'</p>';
							  }
							  return html;
					}
					return function(data){
							  container.html(parseChapterData(data));
					}
		  }
		  
		  //屏幕按钮点击事件处理        
		  function EventHandler(){
					//点击屏幕中央唤出上下边栏
					$(".action-container-mid").click(function(){
							  if(Dom.top_bar.css("display")=="none"){
										Dom.top_bar.show();
							  }else{
										Dom.top_bar.hide();
										Dom.bottom_nav_panel.hide();
							  }
							  if(Dom.bottom_nav.css("display")=="none"){
										Dom.bottom_nav.show();
							  }else{
										Dom.bottom_nav.hide();
										Dom.bottom_nav_panel.hide();
							  }
							  //屏幕滚动时，上下边栏和底部导航隐藏
							  Win.scroll(function(){
										Dom.top_bar.hide();
										Dom.bottom_nav.hide();
										Dom.bottom_nav_panel.hide();
										Dom.icon_fonts.addClass("icon-fonts");
										Dom.icon_fonts.removeClass("current");
							  })
					});
					//字体大小及字体图标交互设置 
					//字体图标交互设置
					Dom.font_menu.click(function(){
							  if(Dom.bottom_nav_panel.css("display")=="none"){
										Dom.bottom_nav_panel.show();
										Dom.icon_fonts.removeClass("icon-fonts");
										Dom.icon_fonts.addClass("current");
							  }else{
										Dom.bottom_nav_panel.hide();
										Dom.icon_fonts.addClass("icon-fonts");
										Dom.icon_fonts.removeClass("current");
							  }
					}) ;
					//字体大小交互设置
					//获得初始字体大小；
					var initialFontSize=parseInt(Util.StorageGetter("font_size")) ;
					if(!initialFontSize){
							  initialFontSize=14;
					}
					console.log(initialFontSize);  //18
					console.log(typeof(initialFontSize));//Number
					$(".container").css("font-size",initialFontSize);
					console.log($(".container").css("font-size"));//18px;
					
					$("#large-font").click(function(){
							  initialFontSize+=1;
							  if (initialFontSize>=22){
										return;
							  }
							  $(".container p").css("font-size",initialFontSize);
							  Util.StorageSetter("font_size",initialFontSize);//存储当前字体大小
					});
					
					$("#small-font").click(function(){
							  initialFontSize-=1;
							  if (initialFontSize<=12){
										return;
							  }
							  $(".container p").css("font-size",initialFontSize);
							  Util.StorageSetter("font_size",initialFontSize);//存储当前字体大小
					});
					
					//"背景"切换效果的交互开发；
					$(".bkg-color").click(function(){
							  var $this = $(this);
							  var bkg = $this.attr("data-color");
							  console.log(bkg);
							  $(".bkg-color").removeClass("select");
							  $this.addClass("select");
							  Dom.Body.removeClass().addClass(bkg);
							  Util.StorageSetter("bkg_class",bkg);
					});
					//字体面板中“黑夜白天”阅读模式的切换；
					var day_menu = $("#day-menu");
					var night_menu = $("#night-menu");
					$(".dn_switch").click(function(){
							  if(day_menu.css("display")=="none"){
										night_menu.hide();
										day_menu.show();
										Dom.Body.removeClass().addClass("darkgray");
							  }else{
										day_menu.hide();
										night_menu.show();
										Dom.Body.removeClass().addClass(initialBkg);
							  }
					});
					//上一章、下一章按钮翻页功能实现；
					$(".prev_btn").click(function(){
							  ReaderInteractive.prevChapter(function(data){
										ReaderUI(data);
							  });
					});
					$(".next_btn").click(function(){
							  ReaderInteractive.nextChapter(function(data){
										ReaderUI(data);
							  })
					})
		  }
})()
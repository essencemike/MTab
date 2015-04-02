/**
 * @name easyTable.js
 * @author mike
 * @version:1.1
 * 此插件主要是表格插件，用于展示数据列表，它的样式基于bootstrap，插件基于jquery
 * 所以使用插件之前要先引入bootstrap样式表，和本身的样式表，还有jquery插件,JSON插件
 * 此插件目前属于测试版本，如有问题请联系我
 */

(function( window ){
	
	//传入 window 全局变量进来
	//使全局变量变成局部变量，使得查找变量更快
	//方便代码压缩，从而不影响使用
	var win = window;
	var document = win.document;
	
	var MTable = function( options ){
		return new MTable.fn.init( options );
	};
	
	//全局data
	MTable.version = 1.1;
	
	//扩展原型，使上面返回的 new 对象 继承以下方法和属性。
	MTable.fn = MTable.prototype = {
		/**
		 * @access Public
		 * @name 初始化的方法
		 * @param {object} 配置对象
		 * @return {this} 
		 */
		init : function( options ){
			var DOM, elem;
			
			//合并默认项
			this.config = $.extend( true, {}, MTable.defaults, options );
			
			//将结果集清空
			if(this.config.serverParam.list){
				this.config.serverParam.list = null;
			}
			
			//检测id是否重复
//			if( this.config.id ){
//				elem = document.getElementById( this.config.id );
//				if( elem ){
//					alert( 'id有重复，请重新设置id属性！！' );
//					return false;
//				}
//			}
			// 存放选中行的数据
			this.selectedData = null;
			
			//存在排序的数组
			this.orderByArr = this.config.serverParam.order || [];
			
			// 存放主体数据(json)
			this.contentData = null;
			this.contentHeader = null;
			
			//记录浏览器窗口变化timer
			this.timer = null;
			
			//处理批量按钮
			this.batch = true;
			
			//创建dom元素
			this.DOM = DOM = this._createDOM();
			
			if(this.DOM){
				//初始化
				this
				._tabBodyClass()                               // 设置面板的颜色
				._tabConHeight()                               // 设置列表的高度
				._tabHeader()                                  // 加载表头
				._tabContent()                                 // 加载表的主题
				._tabFooter()                                  // 加载表的底部
				._addEvent();                                  // 加载改变窗口事件
				
				//easyTable初始化之后的回调函数
				if( typeof this.config.initComplete === 'function'){
					this.config.initComplete.call( this );
				}
			}
		},
		/**
		 * @access Public
		 * @name 刷新列表的方法
		 * @param {null} 
		 * @return {null} 
		 */
		refresh : function(){
			
			this.init( this.config );
		},
		/**
		 * @access Public
		 * @name 获取点击行的所有数据
		 * @param {*} param_name
		 * @return {null} 
		 */
		getSelected : function(){
			
			return this.selectedData;
		},
		/**
		 * @access Private
		 * @name 设置面板的样式
		 * @params{null}
		 * @return this
		 */
		_tabBodyClass : function(){
			var DOM = this.DOM;
			
			$(DOM).find(".tableBody").addClass(this.config.toolBarClass);
			
			return this;
		},
		/**
		 * @access Private
		 * @name 设置列表的高度
		 * @param {*} param_name
		 * @return {this} 
		 */
		_tabConHeight : function(){
			var DOM = this.DOM,
				height = 0;
			
			if(this.config.isPagation){
				height = $(DOM).height() - 100;
			}else{
				height = $(DOM).height() - 50;
			}
				
			$(DOM).find(".tableContent").height( height );
			
			return this;
		},
		/**
		 * @access Private 
		 * @name 创建头部信息
		 * @param {*} param_name
		 * @return {this} 
		 */
		_tabHeader : function(){
			
			this
				._addTitle()         // 添加标题
				._addButton()        // 添加按钮
				._addSingleSearch()  // 添加单列搜索
				._addSearch();       // 添加全列搜索
			
			return this;
		},
		/**
		 * @access Private
		 * @name 添加单列搜索
		 * @param {options}
		 * @return this
		 */
		_addSingleSearch : function(){
			var _this = this,
				DOM = this.DOM;
			
			if(this.config.singleSearch && this._isArray(this.config.singleSearch) && this.config.singleSearch.length != 0){
				
				var html = [],
					arr = this.config.singleSearch;
				
				html.push('<div class="singleSearch '+ this.config.singleSearchWidth +'">');
				html.push('<div class="row">');
				html.push('<div class="col-md-5">');
				html.push('<select class="form-control input-sm">');
				
				for(var i = 0, len = arr.length; i < len; i++){
					html.push('<option value="'+arr[i].mColumn+'">'+arr[i].label+'</option>');
				}
				
				html.push('</select>');
				html.push('</div>');
				html.push('<div class="col-md-6">');
				html.push('<input type="text" class="form-control input-sm">');
				html.push('</div>');
				html.push('<div class="col-md-1">');
				html.push('<button class="btn btn-default btn-sm">搜索</button>');
				html.push('</div>');
				html.push('</div>');
				html.push('</div>');
				
				$(DOM).find(".tableHeader div.row").append(html.join(""));
				
				//绑定原有的where
				var arr = this.config.serverParam.where == null ? [] : this.config.serverParam.where;
				this._bindData(this.config.id + "-singleSearch", arr);
				this._addSingleSearchEvent();
			}
			
			return this;
		},
		/**
		 * @access Private
		 * @name 创建单列搜索事件
		 * @param {null}
		 * @return null
		 */
		_addSingleSearchEvent : function(){
			var DOM = this.DOM,
				_this = this;
			
			$(DOM).find(".tableHeader .singleSearch button").on("click",function(){
				var oldSearch = _this._getBindData(_this.config.id + "-singleSearch"),
					nowSearch = [],
					nowObj = {},
					column = $(DOM).find(".tableHeader .singleSearch select").val(),
					value = $(DOM).find(".tableHeader .singleSearch input").val();
				
				nowObj["conn"] = "and";
				nowObj["paramComare"] = "like";
				nowObj["paramType"] = "string";
				nowObj["paramKey"] = column;
				nowObj["paramValue"] = "%"+ value +"%";
				
				for(var j = 0, len = _this.config.singleSearch.length; j < len; j++){
					if(_this.config.singleSearch[j].mColumn == column && _this.config.singleSearch[j].fnRender){
						nowObj["paramValue"] = _this.config.singleSearch[j].fnRender(value);
					}
				}
				
				nowSearch.push(nowObj);
				
				var arr = oldSearch.concat(nowSearch);
				
				_this.config.serverParam.where = arr;
				
				_this._reDraw();
			});
		},
		/**
		 * @access Private
		 * @name 重绘header栏以下的部分
		 * @param null
		 * @return null
		 */
		_reDraw : function(){
			
			// 存放选中行的数据
			this.selectedData = null;
			
			//存在排序的数组
			this.orderByArr = this.config.serverParam.order;
			
			// 存放主体数据(json)
			this.contentData = null;
			this.contentHeader = null;
			
			//记录浏览器窗口变化timer
			this.timer = null;
			
			//初始化
			this
				._tabContent()                                 // 加载表的主题
				._tabFooter()                                  // 加载表的底部
				._addEvent();                                  // 加载改变窗口事件
			
			//easyTable初始化之后的回调函数
			if( typeof this.config.initComplete === 'function'){
				this.config.initComplete.call( this );
			}
		},
		/**
		 * @access Private
		 * @name 添加标题
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addTitle : function(){
			var DOM = this.DOM;
			
			if( this.config.titleText && $.trim( this.config.titleText) != "" ){
				$(DOM)
					.find(".tableHeader div.row")
					.append('<div class="' + this.config.titleTextWidth + '"><h5><strong>' + this.config.titleText + '</strong></h5></div>');
			}
			
			return this;
		},
		/**
		 * @access Private
		 * @name 添加按钮
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addButton : function(){
			var DOM = this.DOM;
				
			if( this.config.toolBar ){
				$(DOM)
					.find('.tableHeader div.row')
					.append('<div class="pull-right ' + this.config.toolBarWidth + '"><div class="btn-group pull-right"></div></div>');
					
				this._createButton( this.config.toolBarButtons );
			}
			
			return this;
		},
		/**
		 * @access Private
		 * @name 创建按钮
		 * @param {Array} arr
		 * @return {this} 
		 */
		_createButton : function( arr ){
			var DOM = this.DOM,
				_this = this,
				i = 0,
				arrLen = arr.length;
				
			$(DOM).find('.tableHeader div.row .btn-group').empty();
			
			for( ; i < arrLen; i++){
				var btn = document.createElement('button');
				
				btn.className = 'btn ' + arr[i].btnClass + ' btn-sm';
				
				if(document.all){
					btn.innerText = arr[i].name;
				}else{
					btn.textContent = arr[i].name;
				}
				
				if( typeof arr[i].callback == 'function' ){
					var callback = function(obj){
						return function(){
							obj.call(_this);
						};
					}( arr[i].callback );
					
					$(btn).on('click',callback);
				}
				
				$(DOM).find('.tableHeader div.row .btn-group').append( $(btn) );
			}
		},
		/**
		 * @access Private
		 * @name 添加全列搜索
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addSearch : function(){
			var DOM = this.DOM,
				html;
			
			if( this.config.isSearch ){
				html = '<div class="col-md-2 col-md-offset-4" class="search-form">'+
							'<div class="form-group clearfix">'+
								'<label class="control-label col-md-5">全列搜索：</label>'+
								'<div class="col-md-7">'+
									'<input type="text" class="form-control input-sm" id="search">'+
								'</div>'+
							'</div>'+
						'</div>';
						
				$(DOM).find(".tableHeader div.row").append( html );		
			}
			
			return this;
		},
		/**
		 * @access Private 
		 * @name 加载内容
		 * @param {*} param_name
		 * @return {this} 
		 */
		_tabContent : function(){
				
			this
				._createTableHeader()               // 创建表头
				._addHeaderEvent()                  // 添加表头事件
				._createTableContent()              // 创建主体
				._addContentEvent();                // 添加主体事件
			
			return this;
		},
		/**
		 * @access Private
		 * @name 创建表头
		 * @param {*} param_name
		 * @return {this} 
		 */
		_createTableHeader : function(){
			var _this = this;
			
			if( this.config.jsonData ){
				this._jsonConnection(function(data){
					_this.contentHeader = data[0].header;
					_this._operateHeader( data[0].header );
				});
			}else{
				if( this.config.header.length != 0 ){
					this._operateHeader( this.config.header );
				}
			}
			
			
			return this;
		},
		/**
		 * @access Private
		 * @name 处理表头数据
		 * @param {Array} param_name
		 * @return {null} 
		 */
		_operateHeader : function( arr ){
			var arrLen = arr.length,
				i = 0,
				_this = this,
				DOM = this.DOM;
				
			$(DOM).find('.tableContent').empty();
			$(DOM)
				  .find('.tableContent')
				  .append('<table class="table table-striped table-condensed table-bordered table-hover"><thead><tr></tr></thead><tbody></tbody></table>');
			
			for( ; i < arrLen; i++){
				
				var htmlArr = [],
					orderby,
					label;
				
				if(typeof arr[i].label === 'function'){
					label = arr[i].label();
				}else{
					label = arr[i].label;
				}
				
				if( arr[i].hidden ){
					htmlArr.push('<th style="display:none;" width="' + ((arr[i].sWidth) ? arr[i].sWidth : "") + '">' + label + '</th>');
				}else{
					if( this.config.serverParam.order ){
						orderby = this._inOrder(arr[i].mColumn, this.config.serverParam.order);
						
						if( orderby ){
							htmlArr.push('<th class="orderby" width="' + ((arr[i].sWidth) ? arr[i].sWidth : "") + '">');
						}else{
							htmlArr.push('<th width="' + ((arr[i].sWidth) ? arr[i].sWidth : "") + '">');
						}
					}else{
						htmlArr.push('<th width="' + ((arr[i].sWidth) ? arr[i].sWidth : "") + '">');
					}
				}
				
				htmlArr.push('<div class="row" name="' + arr[i].mColumn + '" isorder="' + arr[i].isOrder + '">');
				htmlArr.push('<div class="col-md-12 th-label">' + label + '</div>');
				
				if(arr[i].isOrder){
					
					htmlArr.push('<div class="th-order">');
					
					if( orderby == "desc" ){
						htmlArr.push('<i class="glyphicon glyphicon-chevron-down"></i>');
					}else{
						htmlArr.push('<i class="glyphicon glyphicon-chevron-up"></i>');
					}
					
					htmlArr.push('</div>');
				}
				
				htmlArr.push('</div></th>');
				
				$(DOM).find('.tableContent table thead tr').append( htmlArr.join("") );
			}
		},
		/**
		 * @access Private
		 * @name 判断字段是否参加排序
		 * @param {paramKey}
		 * @return {paramValue}
		 */
		_inOrder : function( key, arr){
			var len = arr.length;
			
			for(var i = 0; i < len; i++){
				if(arr[i].paramKey == key){
					return arr[i].paramValue;
				}
			}
			return null;
		},
		/**
		 * @access Private
		 * @name 添加表头事件
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addHeaderEvent : function(){
			
			this
				._addLabelEvent()            // 添加排序事件
				._addOrderEvent();           // 添加排序（顺序）事件
				
			return this;
		},
		/**
		 * @access Private
		 * @name 添加排序事件
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addLabelEvent : function(){
			var DOM = this.DOM,
				_this = this,
				tableOptions;
			
			$(DOM).find('.tableContent .th-label').on('click',function(){
				
				if($(this).parent().attr("isorder") == "true"){
					
					if( $(this).parent().parent().hasClass("orderby") ){
						
						$(this).parent().parent().removeClass("orderby");
						$(this).parent().find(".th-order").find("i").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
						
						var name = $(this).parent().attr("name");
						
						for(var i = 0, len = _this.orderByArr.length; i < len; i++){
							if( _this.orderByArr[i].paramKey == name ){
								_this.orderByArr.splice(i, 1);
								break;
							}
						}
						
					}else{
						
						$(this).parent().parent().addClass("orderby");
						
						var name = $(this).parent().attr("name");
						
						_this.orderByArr.push({paramKey:name,paramValue:"asc"});
						
					}
					
					_this.config.serverParam.showPage = 1;
					_this.config.serverParam.order = _this.orderByArr;
					
					tableOptions = $.extend( true, _this.config, {isServerOrData:false} );
					
					_this.init( tableOptions );
				}
			});
			
			return this;
		},
		/**
		 * @access Private
		 * @name 添加排序（顺序）事件
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addOrderEvent : function(){
			var DOM = this.DOM,
				_this = this,
				tableOptions;
			
			$(DOM).find('.tableContent .th-order').on('click',function(){
				
				if($(this).parent().attr("isorder") == "true"){
					
					var name = $(this).parent().attr("name");
					
					if($(this).find("i").hasClass("glyphicon-chevron-down")){
						
						$(this).find("i").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
						
						if(!$(this).parent().parent().hasClass("orderby")){
							
							$(this).parent().parent().addClass("orderby");
							
							_this.orderByArr.push({paramKey:name,paramValue:"asc"});
						}else{
							
							for(var i = 0, len = _this.orderByArr.length; i < len; i++){
								if(_this.orderByArr[i].paramKey == name){
									_this.orderByArr[i].paramValue = "asc";
								}
							}
						}
					}else{
						
						$(this).find("i").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
						
						if(!$(this).parent().parent().hasClass("orderby")){
							
							$(this).parent().parent().addClass("orderby");
							
							_this.orderByArr.push({paramKey:name,paramValue:"desc"});
						}else{
							
							for(var i = 0, len = _this.orderByArr.length; i < len; i++){
								if(_this.orderByArr[i].paramKey == name){
									_this.orderByArr[i].paramValue = "desc";
								}
							}
						}
					}
					
					_this.config.serverParam.showPage = 1;
					_this.config.serverParam.order = _this.orderByArr;
					
					tableOptions = $.extend( true, _this.config, {isServerOrData:false} );
					
					_this.init( tableOptions );
				}
			});
			
			return this;
		},
		/**
		 * @access Private
		 * @name 创建主体
		 * @param {*} param_name
		 * @return {this}
		 */
		_createTableContent : function(){
			var data = null,
				_this = this;
			
			if( this.config.jsonData ){
				//采用json加载方式
				this._jsonConnection(function(data){
					//将返回的数据传给this
					_this.contentData = data[0].data;
					
					_this._createTableByData( data );
				});
			}else{
				//否则采用数据库加载方式
				data = this._dataBaseConnection();
				
				//将返回的数据传给this
				this.contentData = data;
				
				this._createTableByData( data );
			}
			
			return this;
		},
		/**
		 * @access Private
		 * @name 判断是否是数组
		 * @param {Array} param_name
		 * @return {this} 
		 */
		_isArray : function( obj ){
			return Object.prototype.toString.call(obj) === '[object Array]';
		},
		/**
		 * @access Private
		 * @name 根据穿过来的数据加载表格
		 * @param {object} data
		 * @return {null} 
		 */
		_createTableByData : function( data ){
			var DOM = this.DOM,
				_this = this,
				tabData,
				tBodyArr = [];
			
			/**
			 * 如果是数组，则是json数据,如果不是这是数据库
			 */
			if( this._isArray( data ) ){
				tabData = data[0].data;
			}else{
				tabData = data.list;
			}
			
			$(DOM).find('.tableContent tbody').empty();
			
			if( tabData ){
				for(var i = 0, len = tabData.length; i < len; i++){
				
					var sData = tabData[i];
					
					_this._bindData( _this.config.id + "-easyTable-" + i, sData);
					
					tBodyArr.push('<tr index="' + i + '">');
					
					if( _this.config.jsonData ){
						for(var j = 0, lens = _this.contentHeader.length; j < lens; j++){
						
							var tD = _this.contentHeader[j];
							
							if(tD.hidden){
								tBodyArr.push('<td style="display:none;" width="'+tD.sWidth+'">'+sData[tD.mColumn]+'</td>');
							}else{
								if(tD.fnRender){
									tBodyArr.push('<td width="'+tD.sWidth+'">'+tD.fnRender(sData)+'</td>');
								}else{
									tBodyArr.push('<td width="'+tD.sWidth+'">'+sData[tD.mColumn]+'</td>');
								}
							}
						}
					}else{
						for(var j = 0, lens = _this.config.header.length; j < lens; j++){
						
							var tD = _this.config.header[j];
							
							if(tD.hidden){
								tBodyArr.push('<td style="display:none;" width="'+tD.sWidth+'">'+sData[tD.mColumn]+'</td>');
							}else{
								if(tD.fnRender){
									tBodyArr.push('<td width="'+tD.sWidth+'">'+tD.fnRender(sData)+'</td>');
								}else{
									tBodyArr.push('<td width="'+tD.sWidth+'">'+sData[tD.mColumn]+'</td>');
								}
							}
						}
					}
					
					tBodyArr.push('</tr>');
				}
				
				this.batch = true;
			}else{
				this.batch = false;
				
				//无数据
				tBodyArr.push('<tr><td colspan="'+ _this.config.header.length +'">无数据</td></tr>');
			}
			
			$(DOM).find('.tableContent tbody').html( tBodyArr.join("") );
		},
		/**
		 * @access Private
		 * @name json加载方式
		 * @param {*} param_name
		 * @return {this} 
		 */
		_jsonConnection : function( callback ){
			var jsonData = null,
				_this = this;
			
			$.ajax({
				type : "GET",
				url : _this.config.jsonData,
				dataType : "json",
				contentType : 'application/json;charset=utf-8',
				success : function(data) {
					jsonData = eval( data );
					
					callback( jsonData );
				},
				error : function(error) {
					alert("获取json数据发生错误:" + error);
				},
				complete:function(XMLHttpRequest,textStatus){}
			});
		},
		/**
		 * @access Private
		 * @name ajax连接数据库
		 * @param {params} 传递的参数，url，callback，async，jsonObj（传递的参数是否为对象）
		 * @return {null} 
		 */
		_operate : function( params, url, callback, async, isObj){
			var data = null,
				async = async || false,
				isObj = isObj || false,
				_this = this;
				
			if( params != null){
				if(isObj){
					data = JSON.stringify( params );
				}else{
					data = _this._convertToJSON( params );
				}
			}
			
			$.ajax({
					type : 'POST',
					async : async,
					contentType : 'application/json;charset=utf-8',
					url : basePath + url,
					data:data,
					dataType : 'json',
					success : function(data) {
						callback(data);
					},
					error:function(){
					    	sysConfirm("后台报错，重新登陆吗？",function(){
					    		window.location.href = basePath;
					    	});
					},
					complete:function(xhr, settings){
						if(xhr.getResponseHeader("sessionstatus")=="timeOut"){ 
					        window.location.href= "login.do";
					        return;
					    }
					}
			});
		},
		/**
		 * @access Private
		 * @name 将对象数组转化成json对象
		 * @param {Array} arr
		 * @return {data} 
		 */
		_convertToJSON : function( arr ){
			var data = "{";
			
			if(arr.length > 0){
				for(var i = 0; i < arr.length; i++){
					if(i == arr.length-1){
						data += "\""+arr[i].key+"\":\"" + arr[i].value + "\"}";
					}else{
						data += "\""+arr[i].key+"\":\"" + arr[i].value + "\",";
					}
				}
				return data;
			}else{
				return "{\"flag\":\"nodata\"}";
			}
		},
		/**
		 * @access Private
		 * @name 数据库加载方式
		 * @param {*} param_name
		 * @return {this} 
		 */
		_dataBaseConnection : function(){
			var _this = this,
				sReturn = null,
				url = null;
			
			if( this.config.isServerOrData ){
				url = this.config.serverUrl;
			}else{
				url = this.config.dataUrl;
			}
			
			if( this.config.isConnection ){
				this._operate( this.config.serverParam, url, function(data){
					if(data.status){
						sReturn = data.result;
					}
				},false,true);
			}else{
				sReturn = $.extend( {}, this.config.serverParam, {list:[]} );
			}
			
			return sReturn;
		},
		/**
		 * @access Private
		 * @name 添加主体事件
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addContentEvent : function(){
			var DOM = this.DOM,
				_this = this;
				
			$(DOM).find(".tableContent tbody tr").on("click",function(){
			
				$(this).addClass("active");
				$(this).siblings().removeClass("active");
				
				var index = $(this).attr("index");
				
				var sData = _this._getBindData( _this.config.id + "-easyTable-" + index ); 
				
				_this.selectedData = sData;
				
				if( typeof _this.config.clickCallback === 'function'){
					_this.config.clickCallback.call( this, sData);
				}
			});
			
			$(DOM).find(".tableContent tbody tr").on("dblclick",function(){
				
				$(this).addClass("active");
				$(this).siblings().removeClass("active");
				
				var index = $(this).attr("index");
				
				var sData = _this._getBindData( _this.config.id + "-easyTable-" + index ); 
				
				_this.selectedData = sData;
				
				if( typeof _this.config.dblclickCallback === 'function'){
					_this.config.dblclickCallback.call( this, sData);
				}
			});
			
			return this;
		},
		/**
		 * @access Private
		 * @name 绑定数据
		 * @param {string} id {object} data
		 * @return {null} 
		 */
		_bindData : function( name, data ){
			
			if( typeof name === 'string' || typeof name === 'number'){
				$('div').data( name, data );
			}else{
				alert('绑定数据的键值必须是number或者string类型！');
			}
			
		},
		/**
		 * @access Private
		 * @name 获取绑定的数据
		 * @param {string} id
		 * @return {object} data 
		 */
		_getBindData : function( name ){
			
			return $('div').data( name );
		},
		/**
		 * @access Private
		 * @name 加载表格的底部
		 * @param {*} param_name
		 * @return {this} 
		 */
		_tabFooter : function(){
			var DOM = this.DOM;
			
			if( this.config.isPagation && !this.config.jsonData ){
				$(DOM).find('.tableFooter').removeClass('hidden');
				
				if( this.config.isPageSize ){
					$(DOM).find('.tableFooter .select-page').removeClass('hidden');
					this._addChangeEvent();//注册事件
				}
				this._createPagation();     //创建页码
			}
			
			if(this.config.batchOperation && this._isArray(this.config.batchOperation) && this.config.batchOperation.length != 0){
				this
					._addAllSelect()
					._addBatchButton();
			}
			
			return this;
		},
		/**
		 * @access Private
		 * @name 添加全选
		 * @param null
		 * @return this
		 */
		_addAllSelect : function(){
			var DOM = this.DOM;
			
			if($(DOM).find('.tableFooter div.row .my-checkbox').length == 0){
				$(DOM)
					.find('.tableFooter div.row')
					.append('<div class="my-checkbox"><input type="checkbox" class="all-select" value=""></div>');
			}
			
			this._addSelectEvent();
			return this;
		},
		/**
		 * @access Private
		 * @name 给全选添加事件
		 * @param null
		 * @return this
		 */
		_addSelectEvent : function(){
			var DOM = this.DOM,
				_this = this;
			
			$(DOM).find(".tableBody").off().on("click","input.all-select",function(){
				if(_this.batch){
					if(this.checked){
						$(DOM).find(".tableBody input.checkbox-select,.tableBody input.all-select").attr("checked",true);
						$(DOM).find(".tableBody input.checkbox-select,.tableBody input.all-select").each(function(){
							this.checked = true;
						});
						$(DOM).find(".tableFooter .btn-group button").attr("disabled",false);
					}else{
						$(DOM).find(".tableBody input.checkbox-select,.tableBody input.all-select").attr("checked",false);
						$(DOM).find(".tableBody input.checkbox-select,.tableBody input.all-select").each(function(){
							this.checked = false;
						});
						$(DOM).find(".tableFooter .btn-group button").attr("disabled",true);
					}
				}
			});
			
			return this;
		},
		/**
		 * @access Private
		 * @name 添加批量处理DOM
		 * @param {null}
		 * @return null
		 */
		_addBatchButton : function(){
			var DOM = this.DOM;
			
			if($(DOM).find('.tableFooter div.row .btn-group').length == 0){
				$(DOM)
					.find('.tableFooter div.row')
					.append('<div class="btn-group"></div>');
			}
				
			this._createFooterButton( this.config.batchOperation );
		},
		/**
		 * @access Private
		 * @name 创建批量的按钮事件
		 * @param {arr}
		 * @return null
		 */
		_createFooterButton : function( arr ){
			var DOM = this.DOM,
				_this = this,
				i = 0,
				arrLen = arr.length;
			
			$(DOM).find('.tableFooter div.row .btn-group').empty();
			
			for( ; i < arrLen; i++){
				var btn = document.createElement('button');
				
				$(btn).attr("disabled",true);
				btn.className = 'btn ' + arr[i].btnClass + ' btn-sm';
				
				if(document.all){
					btn.innerText = arr[i].name;
				}else{
					btn.textContent = arr[i].name;
				}
				
				if( typeof arr[i].callback == 'function' ){
					var callback = function(obj){
						return function(){
							obj.call(_this);
						};
					}( arr[i].callback );
					
					$(btn).on('click',callback);
				}
				
				$(DOM).find('.tableFooter div.row .btn-group').append( $(btn) );
			}
		},
		/**
		 * @access Private
		 * @name 给下拉页注册事件
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addChangeEvent : function(){
			var DOM = this.DOM,
				_this = this;
			
			//先选中默认条数
			$(DOM).find('.tableFooter .pageSize').val( this.config.serverParam.eachRecords );
			
			//注册事件
			$(DOM).find('.tableFooter .pageSize').on('change', function(){
				var value = $(this).val();
				var tableOptions = $.extend( {}, _this.config, {isServerOrData: false} );
				
				_this.config.serverParam.showPage = 1;
				_this.config.serverParam.eachRecords = value;
				
				_this.init( _this.config );
			});
			
			return this;
		},
		/**
		 * @access Private
		 * @name 创建页码
		 * @param {*} param_name
		 * @return {this} 
		 */
		_createPagation : function(){
			var DOM = this.DOM
				_this = this,
				pageSelector = $(DOM).find('.paginations'),
				tableOptions = null;
			
			this._pagePagination({
				selector:pageSelector,
				data: _this.contentData,
				callback: function( options ){
					tableOptions = $.extend( true, {}, _this.config, {serverParam:options,isServerOrData:false} );
					_this.init( tableOptions );
				}
			});
		},
		/**
		 * @access Private
		 * @name 分页
		 * @param {object} options
		 * @return {this} 
		 */
		_pagePagination : function( option ){
			var thisDemo = null,
				_this = this;
			
			var defaults = {
				selector:"body",
				data:null,
				callback:function(optionsData){}
			};
			
			var options = $.extend({},defaults,option);
			
			thisDemo = $(options.selector);
			
			thisDemo.empty();
			
			thisDemo.html( _this._getData(options.data) );
			
			// 首页
			$(options.selector).on("click", ".first-page", function(){
				if(!$(this).parent().hasClass("disabled")){
					options.callback($.extend(true,{},options.data,{showPage:1}));
				}
			});
			// 尾页
			$(options.selector).on("click", ".last-page", function(){
				if(!$(this).parent().hasClass("disabled")){
					var number = Number($(this).attr("page-number"));
					options.callback($.extend(true,{},options.data,{showPage:number}));
				}
			});
			// 上一页
			$(options.selector).on("click", ".previous-page", function(){
				if(!$(this).parent().hasClass("disabled")){
					var number = Number($(options.selector).find(".active").text()) - 1;
					options.callback($.extend(true,{},options.data,{showPage:number}));
				}
			});
			// 下一页
			$(options.selector).on("click", ".next-page", function(){
				if(!$(this).parent().hasClass("disabled")){
					var number = Number($(options.selector).find(".active").text()) + 1;
					options.callback($.extend(true,{},options.data,{showPage:number}));
				}
			});
			// 具体某页
			$(options.selector).on("click", ".number-page", function(){
				if(!$(this).parent().hasClass("disabled")){
					var number = Number($(this).text());
					options.callback($.extend(true,{},options.data,{showPage:number}));
				}
			});
			// 往前翻页
			$(options.selector).on("click", ".less-page", function(){
				if(!$(this).parent().hasClass("disabled")){
					var text = $(this).parent().next().text();
					var number = Number(text) - 1;
					options.callback($.extend(true,{},options.data,{showPage:number}));
				}
			});
			// 往后翻页
			$(options.selector).on("click", ".more-page", function(){
				if(!$(this).parent().hasClass("disabled")){
					var text = $(this).parent().prev().text();
					var number = Number(text) + 1;
					options.callback($.extend(true,{},options.data,{showPage:number}));
				}
			});
		},
		/**
		 * @access Private
		 * @name 处理分页的数据
		 * @param {object} data
		 * @return {html} 
		 */
		_getData : function( data ){
			var arr = [],
				maxPage = 5;
			
			arr.push('<ul class="pagination pagination-sm">');
			if(data.showPage == "1"){
				arr.push('<li class="disabled">');
			}else{
				arr.push('<li>');
			}
			arr.push('<a class="first-page" href="javascript:;">首页</a></li>');
			if(data.showPage == 1){
				arr.push('<li class="disabled">');
			}else{
				arr.push('<li>');
			}
			arr.push('<a class="previous-page" href="javascript:;">上一页</a></li>');
			if(data.totalPages > maxPage){
				var max = Math.ceil(data.showPage / maxPage) * maxPage;
				
				if(max > data.totalPages){
					max = data.totalPages;
				}
				
				if(max > maxPage){
					arr.push('<li><a class="less-page" href="javascript:;">&laquo;</a></li>');
				}
				for(var i = max - maxPage + 1; i<= max; i++){
					if(data.showPage == i){
						arr.push('<li class="active">');
					}else{
						arr.push('<li>');
					}
					arr.push('<a class="number-page" href="javascript:;">'+i+'</a></li>');
				}
				
				if(max < data.totalPages){
					arr.push('<li><a class="more-page" href="javascript:;">&raquo;</a></li>');
				}
			}else{
				for(var i = 1; i <= data.totalPages; i++){
					if(data.showPage == i){
						arr.push('<li class="active">');
					}else{
						arr.push('<li>');
					}
					arr.push('<a class="number-page" href="javascript:;">'+i+'</a></li>');
				}
			}
			//下一页和尾页
			if(data.showPage == data.totalPages){
				arr.push('<li class="disabled">');
			}else{
				arr.push('<li>');
			}
			arr.push('<a class="next-page" href="javascript:;">下一页</a></li>');
			if(data.showPage == data.totalPages){
				arr.push('<li class="disabled">');
			}else{
				arr.push('<li>');
			}
			arr.push('<a page-number="'+data.totalPages+'" class="last-page" href="javascript:;">尾页</a></li>');
			
			arr.push('<li><a href="javascript:;">共'+data.totalRecords+'条数据</a></li></ul>');
			
			return arr.join("");
		},
		/**
		 * @access Private
		 * @name 注册事件
		 * @param {*} param_name
		 * @return {this} 
		 */
		_addEvent : function(){
			var DOM = this.DOM,
				_this = this;
			
			if(DOM){
				$(win).on('resize', function(){
					if(_this.timer){
						clearTimeout(_this.timer);
					}
					_this.timer = setTimeout(function(){
						_this.init( _this.config );
					}, 200);
				});
			}
			
			return this;
		},
		/**
		 * @access Private
		 * @name 创建dom元素
		 * @param {*} param_name
		 * @return {this} 
		 */
		_createDOM : function(){
			var DOM = document.getElementById( this.config.id );
			
			if(DOM){
				DOM.innerHTML = MTable.template;
			}
			
			return DOM;
		}
	};
	
	/**
	 * @access Public
	 * @name 销毁的方法
	 * @param null
	 * @return null
	 */
//	MTable.destory = function(){
//		var _this = this,
//			DOM = this.DOM;
//		
//		$(DOM).remove();
//		
//		console.log(window.MTable);
//		delete window.MTable;
//		console.log(window.MTable);
//		
//		return this;
//	};
	
	//将 .fn.init() 方法 原型传递给 MTable
	MTable.fn.init.prototype = MTable.fn;
	
	//table的默认模版
	MTable.template = 
		'<div class="panel tableBody">'+
			'<div class="panel-heading tableHeader">'+
				'<div class="row"></div>'+
			'</div>'+
			'<div class="panel-body tableContent"></div>'+
			'<div class="panel-footer hidden tableFooter">'+
				'<div class="row">'+
					'<div class="select-page hidden">'+
						'<select class="form-control input-sm pageSize">'+
							'<option value="10">10</option>'+
							'<option value="25">25</option>'+
							'<option value="50">50</option>'+
							'<option value="100">100</option>'+
						'</select>'+
					'</div>'+
					'<div class="pull-right paginations"></div>'+
				'</div>'+
			'</div>'+
		'</div>';
	
	//MTable的默认属性
	MTable.defaults = {
		id: null,
		serverUrl: null,                    // 初始化时候的路径
		dataUrl: null,                      // 分页时候的路径
		jsonData: null,                     // 支持json数据(url)
		isServerOrData: true,               // 默认使用初始化时候的路径,(true:初始化路径和分页路径是一样的)
		isConnection: true,                 // 是否连接数据库，默认是连接
		serverParam : {					    // 默认向后台传递参数
			eachRecords : 10,               // 每页显示条数（10，25，50，100）
			showPage : 1,                   // 当前是第几页
			/*conditions : {                  // 特殊的条件
				order : null,               // 多列排序的对象数组
				like_string : null,         // 多列搜索的对象数组
				in_string : null,           // 字符串对象
				in_int : null,              // 数字对象
				where_int : null,           // 数字相等
				where_string : null         // 字符串相等
			}*/
			where: null,
			order: null,
			group: null,
			having: null
//			where:[{
//				conn: "and",                // 默认为and状态,and | or
//				paramComare: "=",           // 默认是=，[= | > | < | in | ba | like] 
//				paramType: "string",        // 默认为String，[string | int | date | datetime | list | double | float]
//				paramKey: null,             // 实体bean对应字段
//				paramValue: null            // 字段对应值
//			}],
//			order:[{
//				paramKey: null,             // 实体bean对应字段
//				paramValue: "asc"           // 字段对应值 [asc | desc]
//			}],
//			group:[{
//				paramKey: null              // 实体bean对应字段
//			}],
//			having:[{
//				conn: "and",                // 默认为and状态,[and | or]
//				paramComare: "=",           // 默认是=，[ = | > | < | in | ba | like]
//				paramType: "string",        // 默认为String,[string | int | date | datetime | list | double | float]
//				paramKey: null,             // 实体bean对应字段
//				paramValue: null,           // 字段对应值
//				function: "avg"             // 默认是平均，[avg | sum | max | min]
//			}]
		},
		toolBar: true,                     // 是否显示操作按钮，默认不显示
		toolBarWidth: "col-md-4",          // 操作按钮组的宽度
		toolBarClass: "panel-primary",       // 默认是primary
		toolBarButtons: [{                 // 操作按钮组
			name: "按钮",                  // 按钮的名称
			btnClass: "btn-danger",        // 按钮的样式
			callback: function(){          // 按钮的点击事件         
				alert("你好啊！");
			}
		}],
		titleText: "我是表头",              // 是否显示表头，表头的内容
		titleTextWidth: "col-md-2",        // 表头的宽度
		isSearch: false,                   // 是否全列搜索
		isPageSize: false,                 // 是否显示下拉选择每页显示条数
		isPagation: true,                  // 是否分页，默认是
		batchOperation: null,              // 批量操作的按钮组
//		batchOperation: [{
//			name: "批量操作",
//			btnClass: "btn-default",
//			callback: function(){
//				alert("我就是批量操作");
//			}
//		}],
		singleSearch: null,                // 单列搜索下拉选项
		singleSearchWidth: "col-md-4", 
//		singleSearch: [{
//			label: "测站联系人",
//			mColumn: "1"
//		},{
//			label: "字段2",
//			mColumn: "2"
//		},{
//			label: "字段3",
//			mColumn: "3"
//		}],
		header: [{                         // 表头数组 由于添加了批量事件，所以表头添加的checkbox样式统一是checkbox-select,全选的统一是all-select
			label: "字段名",               // 字段的名字
			mColumn: "C_ID",               // 对应数据库的字段
			hidden: false,                 // 该列是否隐藏，默认不隐藏
			sWidth: "",                    // 该列的宽度
			isOrder: true,                 // 是否参加排序，默认参加
			fnRender: null                 // 处理函数
		}],
		clickCallback: null,               // 单击每行的回调函数
		dblclickCallback: null,             // 双击每行的回调函数
		initComplete: null                 // 加载完成以后的回调函数       
	};
	
	//支持AMD加载
	if( typeof define === 'function' && define.amd){
		define('MTable',[],function(){
			return MTable;
		});
	}
	
	//返回对象给全局
	win.MTable = $MTable = MTable;
}( window ));

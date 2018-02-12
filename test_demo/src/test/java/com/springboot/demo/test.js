var dataClientCache_ = {};
dataClientCache_.cache = function(name, data) {
    var d = {};
    d.total = data.length;
    d.data = [];
    for(var i = 0; i < data.length; i++) {
        var dt = $.extend({}, data[i]);
        d.data.push(dt);
    }
    dataClientCache_[name] = d;
    return d;
}
dataClientCache_.getDataByRange = function(name, startIdx, size) {
    var d = dataClientCache_[name];
    if(d) {
        var ret = [];
        var endIdx = startIdx + size - 1;
        endIdx = endIdx > d.total ? d.total-1 : endIdx;
        for(var i=startIdx; i<=endIdx; i++) {
            var dt = $.extend({}, d.data[i]);
            ret.push(dt);
        }
        return ret;
    }
    return [];
};

var tips = $('<div style="position:absolute;display:none;"></div>').appendTo($(document.body));

var sparkUC = function(){
    var cfg_ = [
        {id:'sessionTab', width:100, height:100, minRowCout:7, dataModel:{matsSessionId:'', userId:'&nbsp;', callType:'', callingNum:'', calledNum:'', startTime:null, duration:'', sessionState:'', sessionQuality:'', startTimeLong:0, endTimeLong:0, sourceParty:'', sessionType:'', webExConfId:'', sessionId:'', locusId:''}},
        {id:'deviceLogsTab', width:100, height:100, minRowCout:5, dataModel:{devicename:'&nbsp;', username:'', uploadTime:null, fileName:'', sourceParty:''}},
        {id:'deviceListTab', width:100, height:100, minRowCout:5, dataModel:{devicename:'&nbsp;', userUUID:'', customerUUID:'', matsSessionId:''}},
        {id:'cdrTab_Huron', width:100, height:100, minRowCout:4, dataModel:{cdrId:'', timeRecorder:'&nbsp;', calling_deviceName:'', calling_partyNumber:'', calling_cause_Value:'', calling_cause_Value_name:'', called_deviceName:'', called_partyNumber:'', called_cause_Value:'', called_cause_Value_name:'', duration:'', dateTimeOrigination:0, dateTimeDisconnect:0}},
        {id:'cdrTab_Spark', width:100, height:100, minRowCout:4, dataModel:{cdrId:'', timeRecorder:'&nbsp;', calling_client:'', calling_party:'', called_party:'', duration:'', pairingAction:'', pairingToken:'', trackingIds:null}}
    ];
    var cache_ = {jobSseq:'', isMockup: false, loadedCount: 0, timer:{query:-1, viewLog:{}, retrieveLog:{}, pstnCall:{}, sessCallFlow:{},mediaStats:{}}, sparkUcJobSseqMapped: {}};
    cache_.sparkUcJobSseqMapped.sseqMappeds = [];

    var noDataTip_ = '<b>NO valid data exist.</b>';
    var noPTip_ = 'No privilege, you can send mail to csg-mats@cisco.com';

    var init_ = function(){
        initUI_();
    };
    var initUI_ = function(){
        renderSessionUI_();
        renderCdrUI_();
        renderDeviceLogsUI_();
        renderDeviceListUI_();

        renderTimeZone_();

        renderStartEndTime_(1);
        //init start time/end time
        $('#quickSelTime').delegate('a', "click", function(){
            var thisObj = $(this);

            $('#quickSelTime').find('a').removeClass("selected")
            thisObj.addClass("selected");

            var value = thisObj.attr('matsValue');
            renderStartEndTime_(parseInt(value));
        });

        $('#quickSelTime').find('a:first').click();

        $('#sessionId').blur(function(){
            var val = $.trim($(this).val());
            if(val.length > 0) {
                $("#numCallingParty").attr('disabled', true);
                $("#numCalledParty").attr('disabled', true);
                $("#deviceCallingParty").attr('disabled', true);
                $("#deviceCalledParty").attr('disabled', true);
                if($('#selectdevices').attr("checked")) {
                    $("#userEmail").attr('disabled', true);
                }
            } else {
                $("#deviceCallingParty").attr('disabled', false);
                $("#userEmail").attr('disabled', false);
                if($('#selectcalls').attr("checked")) {
                    $("#deviceCalledParty").attr('disabled', false);
                    $("#numCallingParty").attr('disabled', false);
                    $("#numCalledParty").attr('disabled', false);
                }
            }
        });

        initSortUI_();
    };

    var initSortUI_ = function(){
        var sourceTable, sourceTableHeaders, sortCfg={}, sortHeadersCfg={};
        for(var m=0;m<cfg_.length;m++){
            sourceTable = $('#'+cfg_[m].id);
            sourceTableHeaders = sourceTable.parent().prev();

            sourceTableHeaders.find('th').each(function(index, dom){
                var sorterCfg = $(dom).attr('sorterHeader');
                if(sorterCfg!='false'){
                    $(dom).addClass('header').click(function(){
                        var thObj = $(this);
                        var sourceTable = thObj.parent().parent().parent().next().find('table');
                        var sortMarker = 0;
                        if(thObj.attr('sorting')){
                            sortMarker = parseInt(thObj.attr('sorting'));
                            sortMarker = sortMarker==1?0:1;//0,asc; 1,desc
                        }
                        //reset all header css
                        thObj.parent().find('th').each(function(index, dom){
                            var sorterCfg = $(dom).attr('sorterHeader');
                            if(sorterCfg!='false'){
                                $(dom).removeClass('headerSortUp').removeClass('headerSortDown').addClass('header');
                            }
                        });
                        sortMarker==0?thObj.addClass('headerSortUp'):thObj.addClass('headerSortDown');
                        thObj.attr('sorting', sortMarker);
                        sourceTable.trigger('sorton',[[[thObj[0].cellIndex,sortMarker]]]);
                    });
                }

            });
            sourceTable.tablesorter();
        }
    };

    var renderTimeZone_ = function() {
        var timeZoneMenu = $("#timeZoneMenu");
        var timeZoneDropdown = $("#timeZoneDropdown");

        //var left = timeZoneDropdown.position().left + timeZoneDropdown.width() - timeZoneMenu.width();
        var left = timeZoneDropdown.width() - timeZoneMenu.width();
        timeZoneMenu.css("left", left);

        //init time zone
        var offsetMinutes = -(new Date().getTimezoneOffset());
        if(offsetMinutes>0){
            offsetMinutes = '+'+offsetMinutes;
        }
        if ($('#snapshot').val() != 'true') {
            var timeZoneItem = $("a[matsDesc='" + offsetMinutes + "']", $("#timeZoneMenu"));
            $('#timeZone').val(offsetMinutes);
            $('#dropdownText').text(timeZoneItem[0].innerText);
        }
    }

    var renderStartEndTime_ = function(day){
        if (day > 0 ){
            var targetTimeZone = $('#timeZone').val()*60*1000;

            var endTimestamp = new Date();
            var startTimestamp = new Date();
            var gmtTimestamp = new Date();
            gmtTimestamp.setTime(endTimestamp.getTime()+(endTimestamp.getTimezoneOffset()*60*1000));

            endTimestamp.setTime(gmtTimestamp.getTime()+targetTimeZone);
            startTimestamp.setTime(endTimestamp.getTime()-day*24*60*60*1000);

            $('#startTime').val(startTimestamp.format('yyyy-MM-dd hh:mm'));
            $('#endTime').val(endTimestamp.format('yyyy-MM-dd hh:mm'));
            lockTime_(true);

            valueChange4InputInUI_();
        }else{
            lockTime_(false);
        }
    };

    var lockTime_ = function(isLocked){
        $('#startTime').attr("disabled",isLocked);
        $('#endTime').attr("disabled",isLocked);
    }

    var renderHighlightRow_ = function(rowObj){
        rowObj.click(function(){
            var thisObj = $(this);
            thisObj.siblings().attr('matsSelected','false');
            thisObj.attr('matsSelected','true');
        });
    };
    var getMatsValue_ = function(obj){
        if(obj.attr){
            return FW.util.toJSON(obj.attr('matsValue'));
        }

        return null;
    };
    var getSelectedRow_ = function(tableObj){
        return getMatsValue_(tableObj.find('tr[matsSelected="true"]'));
    };

    var DynamicCDRTable = {
        isSingleton: true,
        instances: {},
        afterWhich: null,
        getCDRTable: function(sourceParty) {

            var instanceName = sourceParty + "CDRTable";

            if(this.isSingleton) {
                if(!this.instances[instanceName]) {
                    this.instances[instanceName] = this.createCDRTable(sourceParty);
                }
                return this.instances[instanceName];
            } else {
                return this.createCDRTable(sourceParty);
            }
        },

        getAllCDRTables: function(sourceParty) {
            return this.instances;
        },

        createCDRTable: function(sourceParty) {
            var row = $("<tr></tr>");
            var cell = $("<td colspan='9' style='background:#fffbe0;padding:5px 30px;'></td>");
            var cdrTable = $("<table class='table  table-striped table-condensed table-hover man_table' style='table-layout: fixed;'><tbody></tbody></table>");

            var cfg;

            if(sourceParty == 'SPARK') {
                cfg = cfg_[4];
            } else {
                cfg = cfg_[3];
            }

            var headerTpl = $('#'+cfg.id+'_header_tpl').html().replace('<!--','').replace('-->','');
            var pagingTpl = $('#page_area_tpl').html().replace('<!--','').replace('-->','');

            cdrTable.append($("<thead>" + headerTpl + "</thead>"));

            cdrTable.attr('id', cfg.id);
            cell.append($(cdrTable));
            cell.append($(pagingTpl));
            row.append(cell);
            row.hide();

            var show_ = function(afterWhich) {
                row.remove();
                row.insertAfter(afterWhich);
                DynamicCDRTable.afterWhich = afterWhich;
                row.show();
                return row;
            };

            var hide_ = function() {
                row.hide();
            };

            return {show: show_, hide:hide_, afterWhich:null};
        },

        showCDRTable: function(afterWhich) {

            if(!afterWhich) {
                afterWhich = this.afterWhich;
            }
            var sourceParty = getMatsValue_(afterWhich).sourceParty;
            var allTables = this.getAllCDRTables();

            $.each(allTables, function(i) {
                this.hide();
            });

            return this.getCDRTable(sourceParty).show(afterWhich);
        }
    };

    var showCDRTable_ = function(dataList, afterWhich) {
        var cfg;

        if(!afterWhich) {
            afterWhich = DynamicCDRTable.afterWhich;
        }
        var sessionObj = getMatsValue_(afterWhich);
        var sourceParty = sessionObj.sourceParty;

        if(sourceParty == 'SPARK') {
            cfg = cfg_[4];
        } else {
            cfg = cfg_[3];
        }

        var cdrTable = DynamicCDRTable.showCDRTable(afterWhich);

        renderCdrUI4NewTable_(beforeRenderCdr_(dataList, sessionObj), cfg);

        return cdrTable;
    };

    var renderSessionUI_ = function(list){
        renderScrollYTab_(list, cfg_[0]);

        var trList = $('#'+cfg_[0].id).find('tbody').find('tr');
        trList.each(function(i, dom){
            var obj = $(dom);
            var firstObj = obj.find('td:first');
            var sessionObj = getMatsValue_(obj);
            var callTypeTd = obj.find('td:eq(1)');

            if(firstObj.html()!='&nbsp;'){
                if(sessionObj.matsSessionId) {
                    firstObj.css('cursor','pointer');
                    firstObj.click(function(){
                        //var thisObj = $(this);
                        var sessionObj = getMatsValue_(obj);
                        if(sessionObj.callType&&sessionObj.callType.indexOf('CMR_MEETING')>=0){
                            MatsExtTags.popTips({name: 'allTipInOne'}).popup({body: 'Please click \"CMR\" in \"Actions\" to see detail'});
                            return;
                        }
                        $(".glyphicon", firstObj).toggleClass(function() {
                            if ($(this).hasClass("glyphicon-triangle-right")) {
                                statusTip_.show().update('Loading...');
                                $('div[name="allTipInOne"]').hide();
                                cache_.loadedCount = 0;

                                if(sessionObj.sourceParty!='SPARK_KIBANA'){
                                    //loadCdrData_(sessionObj);
                                    DynamicCDRTable.getCDRTable(sessionObj.sourceParty).hide();
                                    loadCdrData4NewTable_(obj);
                                    loadDeviceLogsData_(sessionObj);
                                    loadDeviceListData_(sessionObj);
                                }

                                $(".glyphicon-triangle-bottom", obj.parent()).removeClass("glyphicon-triangle-bottom").addClass("glyphicon-triangle-right");
                                $(this).removeClass("glyphicon-triangle-right");
                                return 'glyphicon-triangle-bottom';
                            } else {
                                DynamicCDRTable.getCDRTable(sessionObj.sourceParty).hide();
                                $(this).removeClass("glyphicon-triangle-bottom");
                                return 'glyphicon-triangle-right';
                            }
                        })
                    });

                    if(sessionObj.sourceParty === 'SPARK') {
                        firstObj.find('a:first').find('span:eq(1)').hover(function(ev) {
                            var msg = '<strong>User ID: </strong>' + sessionObj.userId + '<br/><strong>Session ID: </strong>' + sessionObj.sessionId + '<br/><strong>Locus Id: </strong>' + sessionObj.locusId;
                            MatsExtTags.popTips({name: 'allTipInOne'}).popup({position: {left: ev.clientX, top: ev.clientY}, body: msg});
                        });
                    } else {
                        firstObj.find('a:first').find('span:eq(1)').hover(function(ev) {
                            var msg = '<strong>User ID: </strong>' + sessionObj.userId + '<br/><strong>Locus Id: </strong>' + sessionObj.locusId;
                            MatsExtTags.popTips({name: 'allTipInOne'}).popup({position: {left: ev.clientX, top: ev.clientY}, body: msg});
                        });
                    }
                }
                renderHighlightRow_(obj);
            }
            if(callTypeTd.html()){
                callTypeTd.css('cursor','pointer');
                callTypeTd.find('span:eq(0)').hover(function(ev) {
                    var msg = '<strong>Call Type: </strong>' + sessionObj.callType + '<br/><strong>Description: </strong>' + sessionObj.callTypeDesc;
                    MatsExtTags.popTips({name: 'allTipInOne'}).popup({position: {left: ev.clientX, top: ev.clientY}, body: msg});
                });
            }

        });
    };
    var renderSessionPagingUI_ = function(resultDTO){

    };

    var renderDeviceLogsUI_ = function(list){
        renderScrollYTab_(list, cfg_[1]);

        var trList = $('#'+cfg_[1].id).find('tbody').find('tr');
        trList.each(function(i, dom){
            var obj = $(dom);
            var firstObj = obj.find('td:first');
            var sessionObj = getMatsValue_(obj);

            if(firstObj.html()!='&nbsp;'){
                if(sessionObj.devicename) {
                    firstObj.css('cursor','pointer');
                    firstObj.hover(function(ev) {
                        var msg = '<strong>User ID: </strong>' + sessionObj.userId;
                        MatsExtTags.popTips({name: 'allTipInOne'}).popup({position: {left: ev.clientX, top: ev.clientY}, body: msg});
                    });
                }
                //renderHighlightRow_(obj);
            }

        });
    };

    var renderDeviceListUI_ = function(list){
        renderScrollYTab_(list, cfg_[2]);

        /*var trList = $('#'+cfg_[2].id).find('tbody').find('tr');
         trList.each(function(i, dom){
         var obj = $(dom);
         var firstObj = obj.find('td:first');
         var sessionObj = getMatsValue_(obj);

         if(firstObj.html()!='&nbsp;'){
         if(sessionObj.devicename) {
         firstObj.css('cursor','pointer');
         firstObj.hover(function(ev) {
         var msg = '<strong>User ID: </strong>' + sessionObj.userUUID;
         MatsExtTags.popTips({name: 'allTipInOne'}).popup({position: {left: ev.clientX, top: ev.clientY}, body: msg});
         });
         }
         //renderHighlightRow_(obj);
         }

         });*/

    };
    var renderCdrUI_ = function(list){
        renderScrollYTab_(list, cfg_[3]);
    };

    var renderScrollYTab_ = function(list, cfg){
        var getTpl_ = function(id){
            var tpl = $('#'+cfg.id+"_tpl").html();
            tpl = tpl.replace('<!--','').replace('-->','');

            return tpl;
        };

        list = list||[];
        var size = cfg.minRowCout;
        var html = []; var bizData = null, tpl = getTpl_('#'+cfg.id+"_tpl"), htmlEmpty=[];
        //alert(dotpl.applyTpl(tpl, cfg.dataModel));
        for(var m=0;m<size;m++){
            if(list[m]){
                html.push(dotpl.applyTpl(tpl, list[m]));
            }else{
                //htmlEmpty.push(dotpl.applyTpl(tpl, cfg.dataModel));
                html.push(dotpl.applyTpl(tpl, cfg.dataModel));
            }
            //bizData = list[m]||cfg.dataModel;
        }

        var tableObj = $('#'+cfg.id);
        tableObj.find('tbody').html(html.join(''));
        tableObj.trigger("update");

        var trList = tableObj.find('tbody').find('tr');
        trList.each(function(i, dom){
            var obj = $(dom);
            var firstObj = obj.find('td:first');
            if(firstObj.html()!='&nbsp;'){
                renderHighlightRow_(obj);
            }
        });
    };

    var renderCdrUI4NewTable_ = function(list, cfg){
        renderScrollYTab4NewTable_(list, cfg);
    };

    var renderScrollYTab4NewTable_ = function(list, cfg){
        var getTpl_ = function(id){
            var tpl = $('#'+cfg.id+"_tpl").html();
            tpl = tpl.replace('<!--','').replace('-->','');

            return tpl;
        };

        list = list||[];
        var size = cfg.minRowCout;
        var html = []; var bizData = null, tpl = getTpl_('#'+cfg.id+"_tpl"), htmlEmpty=[];
        //alert(dotpl.applyTpl(tpl, cfg.dataModel));
        for(var m=0;m<size;m++){
            if(list[m]){
                html.push(dotpl.applyTpl(tpl, list[m]));
            }else{
                //htmlEmpty.push(dotpl.applyTpl(tpl, cfg.dataModel));
                html.push(dotpl.applyTpl(tpl, cfg.dataModel));
            }
            //bizData = list[m]||cfg.dataModel;
        }

        var tableObj = $('#'+cfg.id);
        tableObj.find('tbody').html(html.join(''));
        tableObj.trigger("update");

        var trList = tableObj.find('tbody').find('tr');
        trList.each(function(i, dom){
            var obj = $(dom);
            var firstObj = obj.find('td:first');
            if(firstObj.html()!='&nbsp;'){
                renderHighlightRow_(obj);
            }
        });
    };

    //process biz data
    var beforeRenderSession_ = function(list){
        list = list||[];
        var d;
        for(var m=0;m<list.length;m++){
            d = list[m];
            d.originUserId = d.userId;

            if(!d.userId){
                d.userId = '<span>N/A</span>';
            }

            d.title = d.originUserId;
            if(!d.title) {
                d.title = 'N/A';
            }
            if(d.sourceParty === 'SPARK'||d.sourceParty === 'SPARK_KIBANA') {
                if(d.userId.length > 16) {
                    d.userId = d.userId.substring(0, 16) + '...';
                }
                if(d.originUserId && d.originUserId.indexOf(',')>0){
                    d.userId = '<span style="color:red">'+d.userId+'</span>';
                }
                d.userId = '<span>'+d.userId+'</span>' + '<span style="color:red; font-size:1.3em; cursor:pointer;" title="Spark Message Call">*</span>';
            } else {
                if(d.originUserId && d.originUserId.indexOf(',')>0){
                    d.userId = '<span style="color:red">'+d.userId+'</span>';
                }
            }
            d.userId = '<a href="javascript:void(0)" title="' + d.title + '" class="man_tablea"><span class="glyphicon glyphicon-triangle-right"></span>'+d.userId+'</a>';
            //d.userId = '<span class="glyphicon glyphicon-triangle-right"></span>' + d.userId;

            if(d.sessionQuality=='Good'){
                d.sessionQuality='<a href="javascript:void(0)" onclick="sparkUC.loadTipInfo(\''+d.matsSessionId+'\',\''+d.matsJobId+'\','+d.startTimeLong+','+d.endTimeLong+')">'+
                    '<span class="label label-good">Good</span>'+
                    '</a>';
            }else if(d.sessionQuality=='Fair'){
                d.sessionQuality='<a href="javascript:void(0)" onclick="sparkUC.loadTipInfo(\''+d.matsSessionId+'\',\''+d.matsJobId+'\','+d.startTimeLong+','+d.endTimeLong+')">'+
                    '<span class="label label-fair">Fair</span>'+
                    '</a>';
            }else if(d.sessionQuality=='Poor'){
                d.sessionQuality='<a href="javascript:void(0)" onclick="sparkUC.loadTipInfo(\''+d.matsSessionId+'\',\''+d.matsJobId+'\','+d.startTimeLong+','+d.endTimeLong+')">'+
                    '<span class="label label-poor">Poor</span>'+
                    '</a>';
            }

            d.actions = '<span id="callflow_'+d.matsSessionId+'"><a href="javascript:void(0)" onclick="sparkUC.analyzeCallFlow(\''+d.matsSessionId+'\','+d.startTimeLong+','+d.endTimeLong+',\''+d.sourceParty+'\')"><span class="link_span link_callflow">Call Flow</span></a></span>';
            var jobSseq = $('#jobSseq').val();
            var jobSseqDemo = "AA6E9DA7-41BD-994E-BB8A-C072E732583906325C47019A1B155895CD9BFA9897DA";
            var jobSseqDemo2 = "4F3C68D4-C189-201C-3BDC-5CEB5AF3C8A2DB441F54D8A17BEB001A9A23DD6CABC1";
            if (/*m == 0 && */jobSseqDemo==jobSseq || jobSseqDemo2==jobSseq) {
                d.actions += '<br/><span id="callflow_1'+d.matsSessionId+'">' +
                    '<a href="javascript:void(0)" onclick="sparkUC.sparkEventAnalysis(\'' + d.matsSessionId + '\',\'' + d.matsSessionId +'\')"><span class="glyphicon glyphicon-bookmark" style="color:#7DDCFB;"></span>&nbsp;Spark Event</a>' +
                    '</span>';
            }
//          if(sq){
//              d.actions=d.actions+'&nbsp;&nbsp;<span><a href="javascript:void(0)" onclick="sparkUC.openwindow4Mediastats()">'+
//              'Media Stats</a></span>';
//          }

            if(d.sessionType&&d.sessionType.indexOf('CMR_MEETING')>=0) {
                d.actions = d.actions + ' | <span><a href="../meeting/confreq.jsp?reqindex=1&keyword=' + encodeURIComponent(d.webExConfId) + '" target="_blank">CMR</a></span>';
            }

            d.duration = toHHMMSS_(d.duration);
            switch(d.sessionState){
                case 1:{
                    d.sessionState = '<span class="label text-issue">Issue Detected</span>';
                    break;
                }
                case 2:{
                    d.sessionState = '<span class="label text-possible">Possible Issue</span>';
                    break;
                }
                case 3:{
                    d.sessionState = '<span class="label text-normal">Normal</span>';
                    break;
                }
                case 20:{
                    d.sessionState = '<span class="label text-normal">Call Ended</span>';
                    break;
                }
                case 100:{
                    d.sessionState = '<span class="label text-possible">Unknown</span>';
                    break;
                }
                default: {
                    d.sessionState = '';
                }
            }
            if(d.sourceParty === 'SPARK') {
                d.sessionState = '<a href="javascript:void(0)" onclick="sparkUC.loadTipInfo(\''+d.matsSessionId+'\', null, null, null, true)">' + d.sessionState + '</a>';
            }
        }

        return list;
    };

    var snapshotCreate_ = function() {
        statusTip_.show().update('Build URL Snapshot...');
        //get query parameter
        var formObj = $('form[name="queryCriteria"]');
        var params = FW.form.getValue(formObj);

        var keyword = $('#keywordX').val();

        var quickSelTime = 1;
        $('#quickSelTime').find('a.selected').each(function(index, ele) {
            quickSelTime = $(this).attr('matsValue');
        });

        // sparkUcJobSseqMapped: JSON.stringify(cache_.sparkUcJobSseqMapped)   ///ERROR!!!
        $.extend(params, {
            startTime: params.startTime+':00',
            endTime: params.endTime+':00',
            keyword: keyword,
            quickSelTime: quickSelTime,
            sparkUcJobSseqMapped: JSON.stringify(cache_.sparkUcJobSseqMapped)
        });
//      delete params.startDate;delete params.endDate;

        console.log('params: ' + params + ", str: " + JSON.stringify(params));

        //send http request
        $.ajax({
            type: "POST",
            url: SERVER_MVC_PATH + 'snapshot/add',//submit job
            data: params,
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                //query job status
                if(FW.statusCode.success===resultObj.status){
                    results = resultObj.results;
                    if (results.length > 0) {
                        matsSnapshotDTO = results[0];
                        /*$('#snapshotDiv').show();
                         $('#snapshotUrl').text(SERVER_MVC_PATH + "snapshot/w/" + matsSnapshotDTO.snapshotUrl);*/
                        openwindow4Snapshot_(SERVER_MVC_PATH + "snapshot/w/" + matsSnapshotDTO.snapshotUrl);
                    }
                }else{
                    alert(resultObj.msg);
                    statusTip_.show().hide();
                }
            },
            error: UIHelper.ajaxErr,
            complete: function(jqXHR, textStatus) {
                statusTip_.hide();
            }
        });
    }

    var reCalculateTime_ = function(){
        $('#quickSelTime').find('a').each(function() {
            if ($(this).hasClass('selected')){
                var value = $(this).attr('matsValue');
                renderStartEndTime_(parseInt(value));
            }
        });
    }

    var query_ = function(){
        $('#doSearch').attr('disabled', true);
        stopTimer_();
        var snapshot = $('#snapshot').val();
        if (snapshot == 'true' && jobSseq != null && jobSseq != '') {
            // in snapshot, we don't re-calculate time
        }else if(from==='sparkgit'){
            $('#quickSelTime').find('a:last').click();
            from = '';
        }else{
            reCalculateTime_();
        }

        //get query parameter
        var formObj = $('form[name="queryCriteria"]');
        var params = FW.form.getValue(formObj);
        if (!params.userEmail && !params.sessionId && !params.numCallingParty && !params.numCalledParty && !params.deviceCallingParty && !params.deviceCalledParty){
            if ((Math.abs(new Date(params.endTime) - new Date(params.startTime)) / 36e5) > 1){
                MFW.notifyError('Your search time is over 1 hour. Please enter search parameters.', {delay: 10});
                $('#doSearch').attr('disabled', false);
                return;
            }
        }
        $.extend(params, {
            startTime: params.startTime+':00',
            endTime: params.endTime+':00'
        });
        delete params.startDate;delete params.endDate;

        statusTip_.show().update('Pending');

        if ($('#jobSseq').val() != null && $('#jobSseq').val() != '' && isSameHash()) {
            cache_.jobSseq = $('#jobSseq').val();
            $('#snapshotBtn').show();
            // get sparkUcJobSseqMapped;
            $.ajax({
                type: "GET",
                url: SERVER_MVC_PATH + 'snapshot/query' + "?jobSseq=" + cache_.jobSseq,
//                  data: params,
                dataType: 'json',
                cache: false,
                success: function(resultObj, textStatus){
                    //query job status
                    if(FW.statusCode.success===resultObj.status){
                        results = resultObj.results;
                        if (results.length > 0) {
                            matsSnapshotDTO = results[0];
                            sparkUcMapped = matsSnapshotDTO.sparkUcJobSseqMapped;
                            cache_.sparkUcJobSseqMapped = JSON.parse(sparkUcMapped);
                            if (!cache_.sparkUcJobSseqMapped) {
                                cache_.sparkUcJobSseqMapped = {};
                                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                            }
                            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
                            if (!sseqMappeds) {
                                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                            }
                        }
                    }else{
                        alert(resultObj.msg);
                        $('#doSearch').attr('disabled', false);
                        statusTip_.show().hide();
                    }
                },
                error: UIHelper.ajaxErr
            });

            queryJobStatusTimer_();
        } else {
            $.ajax({
                type: "POST",
                url: SERVER_MVC_PATH + 'sparkuc/analyzeCdr',//submit job
                data: params,
                dataType: 'json',
                cache: false,
                success: function(resultObj, textStatus){
                    //query job status
                    if(resultObj){
                        if(FW.statusCode.success===resultObj.status){
                            cache_.jobSseq = resultObj.msg;
                            if (!cache_.sparkUcJobSseqMapped) {
                                cache_.sparkUcJobSseqMapped = {};
                                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                            }
                            cache_.sparkUcJobSseqMapped.jobSseq = cache_.jobSseq;
                            $('#jobSseq').val(cache_.jobSseq);
                            $('#snapshotBtn').show();
                            queryJobStatusTimer_();
                        }else{
                            alert(resultObj.msg);
                            $('#doSearch').attr('disabled', false);
                            statusTip_.show().hide();
                        }
                    }
                },
                error: UIHelper.ajaxErr
            });
        }   // end else

        renderCdrUI_();renderDeviceLogsUI_();renderDeviceListUI_();
    };

    var queryJobStatusTimer_ = function(){
        queryJobStatus_();
        cache_.timer.query = window.setInterval(queryJobStatus_, 5*1000);
    };

    var queryJobStatus_ = function(){
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/sc/analyzeStatus/'+cache_.jobSseq,
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj){
                    var dtos = resultObj.results;
                    var statusHtml = [], tmp = '', prodAddr4UI='';
                    for(var m=0;m<dtos.length;m++){
                        tmp = (m+1)+'. ';

                        prodAddr4UI = dtos[m].prodAddress;
                        if(dtos[m].statusType==2){
                            prodAddr4UI = prodAddr4UI.substring(prodAddr4UI.indexOf(':')+1).replace('https://', '');
                            prodAddr4UI = prodAddr4UI.substring(0, prodAddr4UI.indexOf('/'));
                        }
                        prodAddr4UI = prodAddr4UI.replace(':8001', '');

                        tmp += prodAddr4UI+ ' '+(dtos[m].status==3?'<font color="red" matsValue="'+dtos[m].statusName+'">'+dtos[m].desc+'</font>':dtos[m].statusName4Html);

                        statusHtml.push(tmp);
                    }

                    if(resultObj.extMsg==='true'){
                        window.clearInterval(cache_.timer.query);
                        if(statusHtml.join('<br/>').indexOf('failed')>0){
                            statusTip_.stopRoll();
                            if(statusHtml.length>1){
                                tmp = '<button onclick="sparkUC.loadSessionData(1, '+cfg_[0].minRowCout+',{async: false})" class="btn btn-warning btn-xs">Load Result</button> <button onclick="sparkUC.statusTip.hide()" style="margin-left:20px;" class="btn btn-warning btn-xs">Close</button>';
                                statusHtml.push(tmp);
                            }
                            statusTip_.update(statusHtml.join('<br/>'));
                            $('#doSearch').attr('disabled', false);
                        }else{
                            loadSessionData_(1, cfg_[0].minRowCout, {async: false});
                        }
                    }else{
                        statusTip_.update(statusHtml.join('<br/>'));
                    }
                }
            },
            error: UIHelper.ajaxErr
        });
    };

    var loadSessionData_ = function(pageNum, limit, ajaxCfg){
        statusTip_.show().update('Loading Session List...');
        var cfg = {
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/session/list/'+cache_.jobSseq,
            data:{currPage:pageNum, limit:limit},
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj){
                    renderSessionUI_(beforeRenderSession_(resultObj.results));
                    if(!$.isEmptyObject(ajaxCfg)){//first load data after analyzed
                        paging().init(resultObj.total, cfg_[0].minRowCout, loadSessionData_, $('#sessionDiv'));
                    }
                }else{
                    var tmp = $.extend({}, cfg_[0].dataModel);
                    tmp.userId = noDataTip_;
                    renderSessionUI_([tmp]);
                }

                // added @2016/2/3
                var trList = $('#'+cfg_[0].id).find('tbody').find('tr');
                trList.each(function(i, dom){
                    var thisObj = $(this);
                    var sessionObj = getMatsValue_(thisObj);
                    analyzeCallFlow4Cache_(sessionObj.matsSessionId, sessionObj.startTimeLong, sessionObj.endTimeLong);
                })

                statusTip_.hide();
                $('#doSearch').attr('disabled', false);
            },
            error: UIHelper.ajaxErr
        };
        if(ajaxCfg&&!$.isEmptyObject(ajaxCfg)){
            $.extend(cfg, ajaxCfg);
        }

        $.ajax(cfg);
    };

    var stopTimer_ = function(){
        window.clearInterval(cache_.timer.query);
        for(var key in cache_.timer.viewLog){
            window.clearInterval(cache_.timer.viewLog[key]);
        }
        for(var key in cache_.timer.retrieveLog){
            window.clearInterval(cache_.timer.retrieveLog[key]);
        }
        for(var key in cache_.timer.pstnCall){
            window.clearInterval(cache_.timer.pstnCall[key]);
        }
        for(var key in cache_.timer.sessCallFlow){
            window.clearInterval(cache_.timer.sessCallFlow[key]);
        }
        for(var key in cache_.timer.mediaStats){
            window.clearInterval(cache_.timer.mediaStats[key]);
        }
    };

    var loadCdrData_ = function(sessionObj){
        if(sessionObj.sourceParty == 'SPARK') {
            var resultObj = [];
            var d = dataClientCache_.cache('cdrList', resultObj);
            afterLoadCdrData_(resultObj);
            paging().init(d.total, cfg_[3].minRowCout, loadCachedCdrData_, $('#cdrDiv'));
            processStatusTip4ClickSession_();
            return;
        }
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/session/cdr/'+sessionObj.matsSessionId+'/'+sessionObj.startTimeLong+'/'+sessionObj.endTimeLong+'/'+sessionObj.matsJobId,
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                var d = dataClientCache_.cache('cdrList', resultObj);
                afterLoadCdrData_(resultObj);
                paging().init(d.total, cfg_[3].minRowCout, loadCachedCdrData_, $('#cdrDiv'));
                processStatusTip4ClickSession_();
            },
            error: UIHelper.ajaxErr
        });
    };

    var loadCdrData4NewTable_ = function(obj){
        var sessionObj = getMatsValue_(obj);

        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/session/cdr/'+sessionObj.matsSessionId+'/'+sessionObj.startTimeLong+'/'+sessionObj.endTimeLong+'/'+sessionObj.matsJobId,
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                var d = dataClientCache_.cache('cdrList', resultObj);
                var cdrTable = afterLoadCdrData_(resultObj, obj);
                var sourceParty = getMatsValue_(obj).sourceParty;
                var cfg;
                if(sourceParty == 'SPARK') {
                    cfg = cfg_[4];
                } else {
                    cfg = cfg_[3];
                }

                paging().init(d.total, cfg.minRowCout, loadCachedCdrData_, cdrTable.children('td'));
                processStatusTip4ClickSession_();
            },
            error: UIHelper.ajaxErr
        });
    };

    var loadCachedCdrData_ = function(pageNum, limit) {
        var startIdx = (pageNum - 1) * limit;
        var data = dataClientCache_.getDataByRange('cdrList', startIdx, limit);
        afterLoadCdrData_(data);
    }

    var loadCachedDeviceLogsData_ = function(pageNum, limit) {
        var startIdx = (pageNum - 1) * limit;
        var data = dataClientCache_.getDataByRange('deviceLogs', startIdx, limit);
        afterLoadDeviceLogsData_(data);
    }

    var loadCachedDeviceListData_ = function(pageNum, limit) {
        var startIdx = (pageNum - 1) * limit;
        var data = dataClientCache_.getDataByRange('deviceList', startIdx, limit);
        afterLoadDeviceListData_(data);
    }

    var isPstnCall_ = function(numStr){
        var tmpStr = numStr.replace('+','');
        return /^\d+$/.test(tmpStr);
    };
    var beforeRenderCdr_ = function(list, sessionObj){
        list = list||[];
        var d;
        var mv="N/A";
        var localsessionID="N/A";
        var remotsessionID="N/A";
        for(var m=0;m<list.length;m++){
            d = list[m];
            if(d.sourceParty == 'SPARK') {
                d.locusId = sessionObj.locusId;
                d.sessionId = sessionObj.sessionId;
                d.originName = d.name;
                d.name = '<a href="javascript:void(0)" onclick="sparkUC.showTrackingIds(this);">'+d.name+'</a>';
            }
            d.duration = d.duration * 1000;
            d.duration = toHHMMSS_(d.duration);

            //call out or
            //if(isPstnCall_(d.called_partyNumber)||(isPstnCall_(d.calling_partyNumber)&&/^\d+$/.test(d.called_partyNumber))){
            //process "COMMON_WEBEX_PRO_PSTN_TRUNK/192.168.90.76" device name
            var tmpCallingDN = d.calling_deviceName?d.calling_deviceName.split('/')[0]:'';
            var tmpCalledDN = d.called_deviceName?d.called_deviceName.split('/')[0]:'';
            if((trunkHedge4Pstn.indexOf(tmpCalledDN)>=0&&tmpCalledDN!='')
                ||trunkHedge4Pstn.indexOf(tmpCallingDN)>=0&&tmpCallingDN!=''){
                var actionName = 'PSTN Call Flow';
                if(d.called_partyNumber&&!isPstnCall_(d.called_partyNumber)){
                    actionName = 'URI Dialing Call Flow';
                }
                d.actions = '<span id="callflow_'+d.cdrId+'"><a href="javascript:void(0)" onclick="sparkUC.analyzePstnCall(this)">'+actionName+'</a></span><br/>';
            }
            //alert(d);
            if(d){
                localsessionID=d.localSessionID;
                remotsessionID=d.remoteSessionID;
            }
            if(typeof(d.actions) == 'undefined'){
                d.actions='';
            }
            if(d.sourceParty != 'SPARK') {
                d.actions=d.actions+'<span><a href="javascript:void(0)" onclick="sparkUC.loadSessionTipInfo(\''+localsessionID+'\',\''+remotsessionID+'\')">'+
                    '<div class="link_icon link_session"></div>Sessions</a></span>';
            }else{
                d.actions = d.actions+'<span id="callflow_'+d.cdrId+'"><a href="javascript:void(0)" onclick="sparkUC.openwindow4trackingidlist(\''+d.cdrId+'\')">Media Stats</a></span><br/>';
            }

        }
        return list;

    }
    var afterLoadCdrData_ = function(list, obj){
        //renderCdrUI_(beforeRenderCdr_(list));
        var cdrTable = showCDRTable_(list, obj);

        var sessionObj = getMatsValue_(obj);
        var sourceParty = sessionObj.sourceParty;

        // Show PSTN cache
        // added @2016/07/21
        /*var trList = $('#'+cfg_[3].id).find('tbody').find('tr');*/
        var trList = [];
        if(sourceParty == "SPARK") {
            trList = $('#cdrTab_Spark').find('tbody').find('tr');
        } else {
            trList = $('#cdrTab_Huron').find('tbody').find('tr');
        }
        trList.each(function(i, dom){

            var thisObj = $(this);
            var cdrObj = getMatsValue_(thisObj);

            try {
                var d = {
                    called_deviceName: $(thisObj.find('td:eq(4)')[0]).text(),
                    called_partyNumber: $(thisObj.find('td:eq(5)')[0]).text(),
                    calling_deviceName: $(thisObj.find('td:eq(1)')[0]).text(),
                    calling_partyNumber: $(thisObj.find('td:eq(2)')[0]).text()
                }
                analyzePstnCall4Cache_(cdrObj, d);
            } catch (e) {
                console.log("afterLoadCdrData_: " + e);
            }

            if(sourceParty == "SPARK") {
                thisObj.hover(
                    function (ev) {

                        var pairingToken = cdrObj.pairingToken;

                        $(".tr-pairing", thisObj.parent()).removeClass("tr-pairing");

                        if(pairingToken) {
                            console.info("pairing...");
                            var pairedTr = $("tr[matsvalue*='" + pairingToken + "']", thisObj.parent());
                            thisObj.addClass("tr-pairing");
                            pairedTr.addClass("tr-pairing");
                        }
                    },
                    function (ev) {
                        ev = ev || window.event;
                        var relatedTarget = ev.relatedTarget;
                        if($(relatedTarget).hasClass("tr-pairing") || $(relatedTarget).parent().hasClass("tr-pairing")) {
                            return;
                        }
                        $(".tr-pairing", thisObj.parent()).removeClass("tr-pairing");
                    }
                );
            }
        })

        return cdrTable;
    };

    var beforeRenderDeviceList_ = function(list){
        list = list||[];
        var d;
        for(var m=0;m<list.length;m++){
            d = list[m];
            if(d.sourceParty != 'SPARK') {
                if(d.userUUID) {
                    d.actions = '<span type="button" class="glyphicon glyphicon-refresh" style="color: #66c6ec;font-size:14px" title="Retrieve Log" '+(matsP.HuronRetrieveP?'onclick="sparkUC.openwindow(this);"':('onclick="alert(\''+noPTip_+'\')"'))+'></span>';
                    d.actions =d.actions+'&nbsp;&nbsp;<a href=../meetingx/sparkuc/huronPreference.jsp?deviceName='+encodeURIComponent(d.devicename)+' target="_blank"><span width="24px" class="glyphicon glyphicon-cog" style="color: #66c6ec;font-size:14px" title="Device/User Preference Change Notification"></span></a>';
                }
            } else {
                if(d.matsSessionId) {
                    d.actions = '<button type="button" class="btn btn_retrieve" title="Retrieve Log" '+(matsP.HuronRetrieveP?'onclick="sparkUC.retrieveSparkDeviceLog(this);"':('onclick="alert(\''+noPTip_+'\')"'))+'></button>';
                }
            }
        }

        return list;
    };

    var loadDeviceLogsData_ = function(sessionObj){
        var requestURL = '';
        if(sessionObj.sourceParty == 'SPARK') {
            requestURL = SERVER_MVC_PATH + 'sparkuc/session/device/log/spark/' + sessionObj.matsSessionId;
            if(sessionObj.useUserId && sessionObj.originUserId) {
                requestURL = requestURL + '?userId=' + sessionObj.originUserId + '&targetDeviceName=' + sessionObj.targetDeviceName;
            }
            /*var resultObj = [];
             var d = dataClientCache_.cache('deviceLogs', resultObj);
             afterLoadDeviceLogsData_(resultObj);
             paging().init(d.total, cfg_[1].minRowCout, loadCachedDeviceLogsData_, $('#deviceLogsDiv'));
             processStatusTip4ClickSession_();
             return;*/
        } else {
            requestURL = SERVER_MVC_PATH + 'sparkuc/session/device/log/huron/' + sessionObj.matsSessionId;
        }
        $.ajax({
            type: "GET",
            url: requestURL,
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj && resultObj[0] && resultObj[0].devicename != noDataTip_){
                    var isError = false;
                    $.each(resultObj, function(n, value) {
                        if (value.errorMsg != null){
                            statusTip_.stopRoll().update("<div id='esExceptionTips' style='color:red;'>"+value.errorMsg+"</div><br/><button onclick='sparkUC.statusTip.hide()' style='margin-left:20px;' class='btn btn-warning btn-xs'>Close</button>");
                            isError = true;
                            return;
                        }
                    });

                    if (!!isError){
                        return;
                    }

                    var d = dataClientCache_.cache('deviceLogs', resultObj);
                    afterLoadDeviceLogsData_(resultObj);
                    paging().init(d.total, cfg_[1].minRowCout, loadCachedDeviceLogsData_, $('#deviceLogsDiv'));
                    //processStatusTip4ClickSession_();

                    // added @2016/2/3
                    if(sessionObj.sourceParty != 'SPARK') {
                        var trList = $('#'+cfg_[1].id).find('tbody').find('tr');
                        trList.each(function(i, dom){
                            var thisObj = $(this);
                            var deviceLogsObj = getMatsValue_(thisObj);
                            viewDeviceLog4Cache_(deviceLogsObj.fileName, deviceLogsObj.dcId);
                        })
                    }
                } else {
                    var tmp = $.extend({}, cfg_[1].dataModel);
                    tmp.devicename = noDataTip_;
                    renderDeviceLogsUI_([tmp]);
                }
                if(sessionObj.sourceParty == 'SPARK') {
                    if(sessionObj.useUserId && sessionObj.originUserId) {
                        statusTip_.hide();
                    } else {
                        processStatusTip4ClickSession_();
                    }
                } else {
                    processStatusTip4ClickSession_();
                }
            },
            error: function(XMLHttpRequest, textStatus){
                statusTip_.stopRoll().update("<div style='color:red;'>"+XMLHttpRequest.status+" "+XMLHttpRequest.statusText+"</div>");
            }
        });
    };

    var afterLoadDeviceLogsData_ = function(list){
        list = list||[];
        var d;
        for(var m=0;m<list.length;m++){
            d = list[m];
            if(d.initiator && d.sourceParty != 'SPARK'){
                d.trTitle = 'title=\'{initiator:"'+d.initiator+'", ticketId:"'+d.ticketId+'"}\' style="cursor:pointer"';
            }
            d.actions = '<button type="button" class="btn btn_view" title="View Log" '+(matsP.HuronViewLogP?' onclick="sparkUC.viewDeviceLog(this)"':('onclick="alert(\''+noPTip_+'\')"'))+'></button>';
            if(d.sourceParty != 'SPARK'){
                if(matsP.HuronViewLogP){
                    //  d.actions = d.viewLogPath.indexOf('/prtParsedFile')>0?'<a href="'+d.viewLogPath+'" target="_blank" style="cursor:pointer;">Open</a>':'<span style="color:#606060;cursor:pointer" onclick="alert(\'PRTParseEvent status: '+d.viewLogPath+'\')">Open</span>';
                    d.actions = d.viewLogPath.indexOf('/prtParsedFile')>0?'<a href="javascript:void(0)" onclick="sparkUC.recordViewLogUserBehavior(\''+d.devicename+'\',\''+d.viewLogPath+'\',\'true\')" target="_blank" style="cursor:pointer;">Open</a>':'<span style="color:#606060;cursor:pointer" onclick="sparkUC.recordViewLogUserBehavior(\''+d.devicename+'\',\''+d.viewLogPath+'\',\'false\')">Open</span>';
                }else{
                    d.actions = '<span style="color:#606060;cursor:pointer" onclick="alert(\''+noPTip_+'\')">Open</span>';
                }
            }
            d.actions += '<button type="button" class="btn btn_delete" title="Delete Log" onclick="sparkUC.deving(this)"></button>';
        }

        renderDeviceLogsUI_(list);
    };

    var mergeDataWithSearchDevice_ = function(resultObj){
        var userEmail = $('#userEmail').val();
        if(userEmail){
            var searchedDevices = cache_[userEmail];
            if(searchedDevices){
                for(var m=0;m<searchedDevices.length;m++){
                    var isNewDevice = true;
                    for(var n=0;n<resultObj.length;n++){
                        if(searchedDevices[m].devicename==resultObj[n].devicename){
                            $.extend(resultObj[n], searchedDevices[m]);
                            isNewDevice = false;
                            break;
                        }
                    }
                    if(isNewDevice){
                        resultObj.push(searchedDevices[m]);
                    }
                }
            }
        }
    }
    var loadDeviceListData_ = function(sessionObj){
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/session/device/list/'+sessionObj.matsSessionId,
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                mergeDataWithSearchDevice_(resultObj);
                var d = dataClientCache_.cache('deviceList', resultObj);
                afterLoadDeviceListData_(resultObj);
                paging().init(d.total, cfg_[2].minRowCout, loadCachedDeviceListData_, $('#deviceListDiv'));
                processStatusTip4ClickSession_();
            },
            error: UIHelper.ajaxErr
        });
    };
    var afterLoadDeviceListData_ = function(list){
        list = list||[];
        var d;
        for(var m=0;m<list.length;m++){
            d = list[m];
            if(d.type){
                if(d.sourceParty == 'SPARK') {
                    d.trTitle = '';
                } else {
                    d.trTitle = 'title=\'{type:"'+d.type+'", registrationStatus:"'+d.registrationStatus+'"}\' style="cursor:pointer"';
                }
            }
        }

        renderDeviceListUI_(beforeRenderDeviceList_(list));
    };

    var processStatusTip4ClickSession_ = function(){
        cache_.loadedCount++;
        if(cache_.loadedCount==3){
            statusTip_.hide();
        }
    };

    var deving_ = function(){
        alert('developing, will come soon...');
    }

    var reset_ = function(){
        $('#searchBar').parent()[0].reset();
        $('#quickSelTime').find('li:first').click();

        // 2016/2/1
        $('#jobSseq').val('');
        $('#snapshot').val('');
        $('#snapshotUrl').val('');

        $('#quickSelTime').find('a:first').click();
        statusTip_.hide();
    };

    // added @2016/2/3
    var viewDeviceLog4Cache_ = function(fileName, dcId){
        if ($('#jobSseq').val() != null && $('#jobSseq').val() != '' && isSameHash()) {
            cache_.jobSseq = $('#jobSseq').val();
            if (!cache_.sparkUcJobSseqMapped) {
                cache_.sparkUcJobSseqMapped = {};
                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
            }
            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
            for (var i = 0; i < sseqMappeds.length; i++) {
                sseqMapped = sseqMappeds[i];
                if (fileName == sseqMapped.fileName && dcId == sseqMapped.dcId) {
                    queryDeviceLogJobStatusTimer_(sseqMapped.jobSseq, sseqMapped.fileName);
                    useCache = true;
                    break;
                }
            }
        }
    }

    var viewDeviceLog_ = function(srcElement){

        var thisObj = $(srcElement).parents('tr[matsValue]');
        thisObj.siblings().attr('matsSelected','false');
        thisObj.attr('matsSelected','true');

        var obj = getSelectedRow_($('#deviceLogsTab'));

        if(obj){
            $(document.getElementById(obj.fileName)).html('<div class="link_icon link_wait"></div>Pending');
            //send http request
            // from cache @2016/1/29
            var useCache = false;
            if ($('#jobSseq').val() != null && $('#jobSseq').val() != '' && isSameHash() && obj.sourceParty != 'SPARK') {
                cache_.jobSseq = $('#jobSseq').val();
                if (!cache_.sparkUcJobSseqMapped) {
                    cache_.sparkUcJobSseqMapped = {};
                    cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                }
                sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
                for (var i = 0; i < sseqMappeds.length; i++) {
                    sseqMapped = sseqMappeds[i];
                    if (obj.fileName == sseqMapped.fileName && obj.dcId == sseqMapped.dcId) {
                        queryDeviceLogJobStatusTimer_(sseqMapped.jobSseq, obj.fileName);
                        useCache = true;
                        break;
                    }
                }
            }
            if (!useCache) {
                var postData = {fileName:obj.fileName, dcId:obj.dcId};
                if(obj.sourceParty == 'SPARK') {
                    postData.type = 'SPARK';
                } else {
                    postData.type = 'HURON';
                }
                $.ajax({
                    type: "POST",
                    url: SERVER_MVC_PATH + 'sparkuc/downloadHuronDevice',//submit job
                    data: postData,
                    dataType: 'json',
                    cache: false,
                    success: function(resultObj, textStatus){
                        //query job status
                        if(FW.statusCode.success===resultObj.status){
                            // @2016/1/29
                            if (!cache_.sparkUcJobSseqMapped) {
                                cache_.sparkUcJobSseqMapped = {};
                                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                            }
                            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
                            var sseqMapped = {};
                            sseqMapped.fileName = obj.fileName;
                            sseqMapped.dcId = obj.dcId;
                            sseqMapped.jobSseq = resultObj.msg;
                            sseqMapped.sseqType = 'DOWNLOAD_DEVICE_LOGS';
                            sseqMappeds.push(sseqMapped);

                            queryDeviceLogJobStatusTimer_(resultObj.msg, obj.fileName);
                        }else{
                            alert(resultObj.msg);
                            $(document.getElementById(obj.fileName)).html('download fail');
                        }
                    },
                    error: UIHelper.ajaxErr
                });
            }

            //UIHelper.openFullWin('../meetingx/sparkuc/detailLogs.jsp?id='+obj.devicename);
        }else{
            alert('Please select the device!');
        }
    };

    var recordViewLogUserBehavior_ = function(deviceName,viewLogPath,prtParsedFile){
        $.ajax({
            type: "POST",
            url: SERVER_MVC_PATH + 'sparkuc/recordViewLogUserBehavior',//submit job
            data: {deviceName:deviceName},
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
            },
            error: UIHelper.ajaxErr
        });
        if(prtParsedFile=='true'){
            window.open(viewLogPath);
        }else {
            alert('PRTParseEvent status: ' + viewLogPath);
        }
    };

    var openwindow4Snapshot_ = function(snapshotUrl){
        var url="../meetingx/sparkuc/snapshot.jsp?snapshotUrl="+encodeURI(snapshotUrl);
        var iWidth=500;
        var iHeight=167;
        var iTop = (window.screen.availHeight-30-iHeight)/2;
        var iLeft = (window.screen.availWidth-10-iWidth)/2;
        window.open(url,'','height='+iHeight+',innerHeight='+iHeight+',width='+iWidth+',innerWidth='+iWidth+',top='+iTop+',left='+iLeft+',toolbar=no,menubar=no,scrollbars=auto,resizeable=no,location=no,status=no');
    };

    var openwindow4Mediastats_ = function(){
        var url="../test/huronMediaStats.html";
        var iWidth=1200;
        var iHeight=500;
        var iTop = (window.screen.availHeight-30-iHeight)/2;
        var iLeft = (window.screen.availWidth-10-iWidth)/2;
        window.open(url,'','height='+iHeight+',innerHeight='+iHeight+',width='+iWidth+',innerWidth='+iWidth+',top='+iTop+',left='+iLeft+',toolbar=no,menubar=no,scrollbars=auto,resizeable=no,location=no,status=no');
    };

    var openwindow4trackingidlist_=function(cdrId){
        var url=SERVER_MVC_PATH + 'sparkuc/querytrackingidlist/'+cdrId;
        linusStatusTip_.show('tabContent');
        $.ajax({
            url:url,
            type:"GET",
            dataType:"json",
            success: function(trackingIdList) {
                linusStatusTip_.hide('tabContent');
                if(trackingIdList !=null && trackingIdList.length > 0) {
                    var d = dataClientCache_.cache('trackingIdList', trackingIdList);

                    linusStatusTip_.showMaskLayer('tabContent');

                    var width = 1000;
                    var scrollTop = $(window).scrollTop();
                    var pWidth = $('#tabContent').width();
                    var pHeight = $('#tabContent').height();
                    var left = ($('#tabContent').width() - width) / 2;
                    var top = 50 + scrollTop;

                    $("#trackingIDListDivWin").css({left: left, top: top});
                    $("#trackingIDListDivWin").css({width: width});
                    $("#trackingIDListDivWin").css({height: 200});
                    $("#trackingIDListDivWin").show();

                    var trackingIDTabHead = $("#trackingIDTabHead");
                    var trackingIDTabBody = $("#trackingIDTabBody");
                    var th = $("<tr><th width='15%'>TrackingID</th><th width='20%'>Join Time</th><th width='20%'>Leave Time</th><th width='22%'>Linus Media Stats</th><th width='22%' style='display:none'>Edonus Media Stats</th></tr>");
                    var tdTmpl = "<tr><td width='15%' style='word-wrap:break-word;word-break:break-all;'>${trackingID}</td><td width='20%'>${joinTime}</td><td width='20%'>${leaveTime}</td><td width='22%' id='callflow_linus_${trackingID}'></td><td width='22%' style='display:none' id='callflow_edonus_${trackingID}'></td></tr>";

                    trackingIDTabHead.css({background: 'white'});
                    trackingIDTabBody.css({background: 'white'});

                    $("thead", trackingIDTabHead).empty();
                    $("tbody", trackingIDTabBody).empty();

                    $("thead", trackingIDTabHead).append(th);

                    $.each(trackingIdList, function(idx, ele) {
                        var tid=ele.wbxTrackingID;
                        if(tid.indexOf('@')>0){
                            tid=ele.wbxTrackingID.substring(0, ele.wbxTrackingID.indexOf('@'))
                        }
                        var td = $(tdTmpl.replace('${trackingID}', ele.wbxTrackingID).replace('${joinTime}', ele.joinTime)
                            .replace('${leaveTime}', ele.leaveTime).replace('${trackingID}', tid).replace('${trackingID}', tid));
                        $("tbody", trackingIDTabBody).append(td);
                        if(ele.extMsg==='true'){
                            $('#callflow_linus_'+tid).html('submit job...');
                            $('#callflow_edonus_'+tid).html('submit job...');
                            analyzeMediaStatsStatusTimer_(tid,ele.linussSeq,"SPARK_"+cdrId);
                            // analyzeMediaStatsStatusTimer_(tid,ele.edonussSeq,"SPARK_"+cdrId);
                        }else{
                            $('#callflow_linus_'+tid).html(ele.extMsg);
                            // $('#callflow_edonus_'+tid).html(ele.extMsg);
                        }
                    });
                }
                else {
                    var alertDialog =  $('<div class="alert alert-warning alert-dismissible" role="alert" style="text-align:center;position:absolute;z-index:99999;">' +
                        '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>No TrackingID Found!</div>');

                    var width = 600;
                    var scrollTop = $(window).scrollTop();
                    var pWidth = $('#tabContent').width();
                    var pHeight = $('#tabContent').height();
                    var left = ($('body').width() - width) / 2;
                    var top = 300 + scrollTop;

                    alertDialog.css({left: left, top: top});
                    alertDialog.css({width: width});

                    $('body').append(alertDialog);

                    alertDialog.fadeOut(7000, function() {
                        $('.close', alertDialog).click();
                    });
                }
            },
            error: function() {
                //logout();
            }
        });
    };

    function closeDivWin_() {
        for(var key in cache_.timer.mediaStats){
            window.clearInterval(cache_.timer.mediaStats[key]);
        }
        $('#trackingIDListDivWin').hide();
        linusStatusTip_.hideMaskLayer('tabContent');
    }


    var openwindow_ = function(srcElement){
        var obj = $(srcElement).parents('tr[matsValue]');
        var m="N/A";
        var t="N/A";
        var deviceName="N/A";
        var status="N/A";
        if(obj.attr('matsvalue') !="undefined" && obj.attr('matsvalue') !=""){
            m=FW.util.toJSON(obj.attr('matsvalue'));
            deviceName=m.devicename;
        }
        if(obj.attr('title') !="undefined" && obj.attr('title') !=""){
            t=FW.util.toJSON(obj.attr('title'));
            status=t.registrationStatus;
        }
        var url="../meetingx/sparkuc/retrievelogwithticket.jsp?deviceName="+deviceName+"&registrationStatus="+status;

        var iHeight=167;
        var iWidth=500;
        var iTop = (window.screen.availHeight-30-iHeight)/2;
        var iLeft = (window.screen.availWidth-10-iWidth)/2;
        window.open(url,'','height='+iHeight+',innerHeight='+iHeight+',width='+iWidth+',innerWidth='+iWidth+',top='+iTop+',left='+iLeft+',toolbar=no,menubar=no,scrollbars=auto,resizeable=no,location=no,status=no');
    };

    var queryDeviceLogJobStatusTimer_ = function(sseq, fileName){
        queryDeviceLogJobStatus_(sseq, fileName);
        cache_.timer.viewLog[fileName] = window.setInterval(queryDeviceLogJobStatus_, 5*1000, sseq, fileName);
    };
    var queryDeviceLogJobStatus_ = function(sseq, fileName){
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/analyzeStatus/'+sseq,
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj){
                    var statusName = resultObj.statusName4Html;
                    statusName = statusName.replace(/"/ig,"");
                    var targetObj = $(document.getElementById(fileName));
                    if(!$.isEmptyObject(statusName)){
                        targetObj.html(statusName);
                    }

                    if(statusName.indexOf('Analyzed')>=0||statusName.indexOf('fail')>0){
                        window.clearInterval(cache_.timer.viewLog[fileName]);
                        if(resultObj.statusType==2&&resultObj.status==2){
                            targetObj.html('<a href="'+resultObj.desc+'" target="_blank">Open</a>');
                        }else{
                            targetObj.html('<a href="javascript:void(0)">'+statusName+'</a>');
                            cache_[fileName] = {};
                            $.extend(cache_[fileName], {jobDesc:resultObj.desc});

                            targetObj = $(document.getElementById(fileName));
                            targetObj.find('a:first').click(function(){
                                var thisObj = $(this);
                                var desc = cache_[fileName].jobDesc;
                                var oldId = thisObj.parent().attr('id');
                                var newId = oldId.substring(0, oldId.indexOf('.')).replace('-', '_');
                                divTip.open({id:newId, srcElement:this, title:thisObj.html(), body:desc.replace(/\n/ig, '<br/>'), width:419, height:300});
                            });
                        }
                    }
                }
            },
            error: UIHelper.ajaxErr
        });
    };

    var mockupCounter = 0, statusTimer;
    var mockupDownloadStatus_ = function(){
        var obj = getSelectedRow_($('#deviceListTab'));

        var statusName = ['Connecting...','Downloading','Finish'];
        var statusIdx = mockupCounter%3;

        $('#retrieve_status_'+obj.devicename).html(statusName[statusIdx]);
        mockupCounter++;
        if(mockupCounter==3){
            mockupCounter = 0;
            window.clearInterval(statusTimer);
        }
    };
    var retrieveSparkDeviceLog_ = function(srcElement){

        statusTip_.show().update('Loading...');

        var obj = $(srcElement).parents('tr[matsValue]');

        if(obj.attr('matsvalue') !="undefined" && obj.attr('matsvalue') !=""){
            var m = FW.util.toJSON(obj.attr('matsvalue'));
            var sessionObj = {
                matsSessionId: m.matsSessionId,
                sourceParty: 'SPARK',
                useUserId: true,
                originUserId: m.userUUID,
                targetDeviceName: m.devicename
            };
            loadDeviceLogsData_(sessionObj);
        }
    };

    var retrieveLogWithTicket_ = function(ticketId){
        var obj = getSelectedRow_($('#deviceListTab'));
        //var obj = getSelectedRow_($('#deviceListTab'));
        if(obj){
            if(obj.devicename&&obj.userUUID){
                $('#retrieve_status_'+obj.devicename).html('<div class="link_icon link_wait"></div>Pending...');

                $.ajax({
                    type: "POST",
                    url: SERVER_MVC_PATH + 'sparkuc/uploadHuronDeviceLogWithTicketId/'+obj.devicename+'/'+obj.userUUID,
                    dataType: 'json',
                    cache: false,
                    data:{ticketId:ticketId},
                    success: function(resultObj, textStatus){
                        if(resultObj){
                            //query job status
                            if(FW.statusCode.success===resultObj.status){
                                var sobj = $('#deviceListTab').find('tr[matsSelected="true"]');
                                if(sobj.attr('title') !="undefined" && sobj.attr('title') !=""){
                                    var t=FW.util.toJSON(sobj.attr('title'));
                                    if(t.registrationStatus!=null && t.registrationStatus.toLowerCase()=="registered"){
                                        // @2016/1/29
                                        if (!cache_.sparkUcJobSseqMapped) {
                                            cache_.sparkUcJobSseqMapped = {};
                                            cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                                        }
                                        sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
                                        var sseqMapped = {};
                                        sseqMapped.devicename = obj.devicename;
                                        sseqMapped.userUUID = obj.userUUID;
                                        sseqMapped.extMsg = resultObj.extMsg;
                                        sseqMapped.jobSseq = resultObj.msg;
                                        sseqMapped.sseqType = 'UPLOAD_DEVICE_LOGS_W_TICKET_ID';
                                        sseqMappeds.push(sseqMapped);
                                        queryRetrieveStatusTimer_(obj.devicename, resultObj.msg, obj.userUUID, resultObj.extMsg);
                                    }else{
                                        $('#retrieve_status_'+obj.devicename).html('<div class="link_icon link_wait"></div>Queued');
                                    }
                                }else{
                                    queryRetrieveStatusTimer_(obj.devicename, resultObj.msg, obj.userUUID, resultObj.extMsg);
                                }
                            }else{
                                $('#retrieve_status_'+obj.devicename).html(resultObj.msg);
                            }
                        }
                    },
                    error: UIHelper.ajaxErr
                });
            }else{
                alert('Lack of necessary parameters!');
            }
        }else{
            alert('Please select the device!');
        }
    };

    var queryRetrieveStatusTimer_ = function(deviceName, deviceUUID, userUUID, customerUUID){
        $('#retrieve_status_'+deviceName).html('<div class="link_icon link_wait"></div>Connecting...');
        //queryUploadStatus_(deviceName, deviceUUID, userUUID, customerUUID);
        cache_.timer.retrieveLog[deviceName] = window.setInterval(queryRetrieveStatus_, 10*1000, deviceName, deviceUUID, userUUID, customerUUID);
    };
    var queryRetrieveStatus_ = function(deviceName, deviceUUID, userUUID, resStr){
        var resInfo = resStr.split(',');
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/uploadHuronDeviceLog/'+deviceUUID+'/'+userUUID+'/'+resInfo[0]+'/'+resInfo[1],
            dataType: 'json',
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj){
                    var statusName = resultObj.msg;
                    $('#retrieve_status_'+deviceName).html('<b>'+statusName+'</b>');

                    if(statusName.indexOf('success')>=0||statusName.indexOf('fail')>=0||statusName.indexOf('none')>=0){
                        window.clearInterval(cache_.timer.retrieveLog[deviceName]);
                        if(statusName.indexOf('success')>=0){
                            updateDeviceLogs_();
                        }
                    }
                }
            },
            error: UIHelper.ajaxErr
        });
    };
    var updateDeviceLogs_ = function(){
        var obj = getSelectedRow_($('#sessionTab'));

        var trList = $('#deviceListTab').find('tbody tr');
        if(trList.length>0){
            var deviceNames = []; var matsValue = null;
            var userUuids = [];
            for(var m=0;m<trList.length;m++){
                matsValue = getMatsValue_($(trList[m]));
                if($.trim(matsValue.devicename).length > 0) {
                    deviceNames.push(matsValue.devicename);
                }
                if($.trim(matsValue.userUUID).length > 0) {
                    userUuids.push(matsValue.userUUID);
                }
            }
            queryDeviceLogs_(deviceNames.join(','),userUuids.join(','));
        }
    };

    //find all current device to append the searched device info
    var appendDeviceInfo_ = function(devices){
        var trList = $('#deviceListTab').find('tbody tr');
        if(trList.length>0&&getMatsValue_($(trList[0])).userUUID){
            var sessionTrList = $('#sessionTab').find('tbody tr');
            if(sessionTrList.length<=0){//there is no "Session" data
                return false;
            }

            //merge device info with device from "Search Calls"
            var tmpJson = {};
            for(var m=0;m<devices.length;m++){
                tmpJson[devices[m].devicename]=devices[m];
            }

            trList.each(function(index, dom){
                var obj = $(dom);
                var deviceName = getMatsValue_(obj).devicename;
                var d = tmpJson[deviceName];
                if(d){
                    obj.attr('title', '{type:"'+d.type+'", registrationStatus:"'+d.registrationStatus+'"}');
                    obj.attr('style', 'cursor:pointer');
                }
            });
            return true;
        }
        return false;
    };
    var searchDevice_ = function(){
        stopTimer_();
        var email;
        var deviceCallingParty;
        var feedbackID = $('#sessionId').val();
        if(!$('#userEmail').attr('disabled')) {
            email = $('#userEmail').val();
            deviceCallingParty = $('#deviceCallingParty').val();
        }
        // added @3/15/2017
        var formObj = $('form[name="queryCriteria"]');
        var params = FW.form.getValue(formObj);
        var quickSelTime = 1;
        $('#quickSelTime').find('a.selected').each(function(index, ele) {
            quickSelTime = $(this).attr('matsValue');
        });

        // sparkUcJobSseqMapped: JSON.stringify(cache_.sparkUcJobSseqMapped)   ///ERROR!!!
        /*$.extend(params, {
         startTime: params.startTime+':00',
         endTime: params.endTime+':00',
         quickSelTime: quickSelTime,
         sparkUcJobSseqMapped: JSON.stringify(cache_.sparkUcJobSseqMapped)
         });*/

        if(email || feedbackID || deviceCallingParty){
            var dt, url;
            if(feedbackID) { // search Spark client log by feed back id.
                dt = {feedbackID: feedbackID};
                url = 'sparkuc/device/spark/search';
            } else {
                dt = {userEmail: email, deviceCallingParty: deviceCallingParty, startTime: params.startTime+':00', endTime: params.endTime+':00'};
                url = 'sparkuc/device/huron/search';
            }
            statusTip_.show().update('Search Device...');
            $.ajax({
                type: "GET",
                url: SERVER_MVC_PATH + url,
                dataType: 'json',
                data: dt,
                cache: false,
                success: function(resultObj, textStatus){
                    if(resultObj){
                        if(FW.statusCode.success!=resultObj.status){
                            alert(resultObj.msg);
                            return;
                        }
                        var devices = FW.util.toJSON(resultObj.msg);
                        cache_[email] = devices;


                        //if(!appendDeviceInfo_(devices)){
                        var d = dataClientCache_.cache('deviceList', devices);
                        afterLoadDeviceListData_(devices);
                        paging().init(d.total, cfg_[2].minRowCout, loadCachedDeviceListData_, $('#deviceListDiv'));
                        //}

                        //query device logs
                        if(!feedbackID) {
                            updateDeviceLogs_();
                        } else {
                            var d = dataClientCache_.cache('deviceLogs', resultObj.results);
                            afterLoadDeviceLogsData_(resultObj.results);
                            paging().init(d.total, cfg_[1].minRowCout, loadCachedDeviceLogsData_, $('#deviceLogsDiv'));
                            statusTip_.hide();
                        }
                    }else{
                        statusTip_.stopRoll().update("There is no available data!");
                    }
                },
                error: UIHelper.ajaxErr
            });
        }
        /**
         else if (!!deviceCallingParty) {  // by deviceCallingParty
            queryDeviceLogs_(deviceCallingParty);
        }*/
        else {
            alert('Please input "User/Device(Calling Party)/Feedback ID" information!');
        }
    };
    var retrieveLog_ = function(){
        stopTimer_();
        var email = $('#userEmail').val();
        var deviceCallingParty = $('#deviceCallingParty').val();
        if(email){
            statusTip_.show().update('Search Device...');
            $.ajax({
                type: "GET",
                url: SERVER_MVC_PATH + 'sparkuc/device/search',
                dataType: 'json',
                data: {userEmail: email},
                cache: false,
                success: function(resultObj, textStatus){
                    if(resultObj){
                        if(FW.statusCode.success!=resultObj.status){
                            alert(resultObj.msg);
                            return;
                        }
                        var devices = FW.util.toJSON(resultObj.msg);
                        cache_[email] = devices;

                        if(!appendDeviceInfo_(devices)){
                            var d = dataClientCache_.cache('deviceList', devices);
                            afterLoadDeviceListData_(devices);
                            paging().init(d.total, cfg_[2].minRowCout, loadCachedDeviceListData_, $('#deviceListDiv'));
                        }

                        //query device logs
                        updateDeviceLogs_();
                    }else{
                        statusTip_.stopRoll().update("There is no available data!");
                    }
                },
                error: UIHelper.ajaxErr
            });
        } else if (!!deviceCallingParty) {  // by deviceCallingParty
            queryDeviceLogs_(deviceCallingParty);
        } else{
            alert('Please input "User/Device(Calling Party)" information!');
        }
    };
    var queryDeviceLogs_ = function(deviceNames,userUuids){
        statusTip_.show().update('Search Device Logs...');

        var deviceCallingParty = $('#deviceCallingParty').val();

        //get query parameter
        var formObj = $('form[name="queryCriteria"]');
        var params = FW.form.getValue(formObj);

        /*var keyword = $('#keywordX').val();

         var quickSelTime = 1;
         $('#quickSelTime').find('a.selected').each(function(index, ele) {
         quickSelTime = $(this).attr('matsValue');
         });*/

        // sparkUcJobSseqMapped: JSON.stringify(cache_.sparkUcJobSseqMapped)   ///ERROR!!!
        $.extend(params, {
            startTime: params.startTime+':00',
            endTime: params.endTime+':00'
        });

        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/session/device/log/query',
            dataType: 'json',
            data: {deviceNames: deviceNames,userUuids: userUuids, startTime: params.startTime, endTime: params.endTime},
            cache: false,
            success: function(resultObj, textStatus){
//              afterLoadDeviceLogsData_(resultObj);

                var isError = false;
                $.each(resultObj, function(n, value) {
                    if (value.errorMsg != null){
                        statusTip_.stopRoll().update("<div id='esExceptionTips' style='color:red;'>"+value.errorMsg+"</div>");
                        isError = true;
                        return;
                    }
                });

                if (!!isError){
                    return;
                }

                var d = dataClientCache_.cache('deviceLogs', resultObj);
                afterLoadDeviceLogsData_(resultObj);
                paging().init(d.total, cfg_[1].minRowCout, loadCachedDeviceLogsData_, $('#deviceLogsDiv'));

                // by deviceCallingParty
                if (resultObj != null && resultObj.length > 0) {
                    statusTip_.hide();
                    /**
                     if (!!deviceCallingParty){
                        try {
                            var userId = resultObj[0].userId;
                            var deviceName = resultObj[0].devicename;
                            console.log("username got from elastics search by userId:" + userId + ", deviceName: " + deviceName);


                            afterLoadDeviceListData_([{
                                    devicename: deviceName,
                                    type: '',
                                    registrationStatus: '',
                                    userUUID: userId
                            }]);
                        } catch (e) {
                            alert('Can\'t get device log by Elastics Search!');
                            console.log(e);
                        }
                    }**/
                }else{
                    /**
                     if (!!deviceCallingParty){
                          var deviceName = $("#deviceCallingParty").val();
                          var devices = [{devicename: deviceName}];
                          afterLoadDeviceListData_(devices);
                        }**/

                    var tmp = $.extend({}, cfg_[1].dataModel);
                    tmp.devicename = noDataTip_;
                    renderDeviceLogsUI_([tmp]);

                    statusTip_.hide();
                }

            },
            error: function(XMLHttpRequest, textStatus){
                statusTip_.stopRoll().update("<div id='esExceptionTips' style='color:red;'>"+XMLHttpRequest.status+" "+XMLHttpRequest.statusText+"</div>");

            }
        });
    };

    // added @05/04/2016
    var searchDeviceListII_ = function(userId, deviceName){
        console.log("userId: " + userId + ", deviceName: " + deviceName);
        devices = [];
        device = {
            devicename: deviceName,
            type: '',
            registrationStatus: '',
            userUUID: userId
        };
        devices.push(device);

        /**
         if(!appendDeviceInfo_(devices)){
            var d = dataClientCache_.cache('deviceList', devices);**/
        afterLoadDeviceListData_(devices);
        paging().init(devices.total, cfg_[2].minRowCout, loadCachedDeviceListData_, $('#deviceListDiv'));
        //}
    }
    // added @04/27/2016
    var searchDeviceList_ = function(userId){
        stopTimer_();
        console.log("userUuid: " + userId);

        if(!!userId){
            statusTip_.show().update('Search Device List...');
            $.ajax({
                type: "GET",
                url: SERVER_MVC_PATH + 'sparkuc/device/search',
                dataType: 'json',
                data: {userUuid: userId},
                cache: false,
                success: function(resultObj, textStatus){
                    if(resultObj){
                        if(FW.statusCode.success!=resultObj.status){
                            alert(resultObj.msg);
                            return;
                        }
                        var devices = FW.util.toJSON(resultObj.msg);

                        if(!appendDeviceInfo_(devices)){
                            afterLoadDeviceListData_(devices);
                        }
                    }else{
                        alert('There is no available data for Device List!');
                        statusTip_.hide();
                    }
                },
                error: UIHelper.ajaxErr
            });
        } else{
            alert('Please enter UserId!');
        }
    };

    var statusTip_ = {
        show: function(){
            var analyzeObj = $('#progressing');
            if(analyzeObj.length==0){
                var html = '<div id="progressing" style="position:absolute;left:5px;top:'+$('#sessionDiv').position().top+'px;background-color:#FFF;width:100%; height:100%;z-index:30000;opacity:.60; filter: alpha(opacity=60); -moz-opacity: 0.6;">' +
                    '<div id="progressing_sub" style="position:absolute;left:45%;top:15%;z-index:30001;">'+
                    '<img src="'+SERVER_PATH+'page/meetingx/cms/js/images/loading.gif" border="0"></img>'+
                    '<span style="font-weight:bold;position:absolute;left:40px;top:10px;z-index:30002;width:600px;" matsExt="jobStatus">...</span>' +
                    '</div>'+
                    '</div>';
                $('#searchResult').append(html);
            }else{
                analyzeObj.find('img').attr('src', SERVER_PATH+'page/meetingx/cms/js/images/loading.gif');
                analyzeObj.show();
            }
            return statusTip_;
        },
        update: function(statusName){
            $('#progressing').find('span[matsExt="jobStatus"]').html(statusName);
            if(statusName.indexOf("esExceptionTips") > 0){
                $('#progressing_sub').attr('style', 'position:absolute;left:'+Math.round(((($('#sessionDiv').width()-$('#esExceptionTips').width())/2)/$('#sessionDiv').width())*100)+'%;top:15%;z-index:30001;');
            }
            return statusTip_;
        },
        hide: function(){
            $('#progressing').hide();
            return statusTip_;
        },
        stopRoll: function(){
            $('#progressing').find('img').attr('src', SERVER_PATH+'page/meetingx/cms/js/images/loading.png');
            return statusTip_;
        },
        getTip: function(){
            return $('#progressing').find('span[matsExt="jobStatus"]').html();
        }
    };

    toHHMMSS_ = function(longDuration){
        var hour = longDuration<=3?0:parseInt(longDuration / (60 * 60 * 1000));
        var min = (parseInt(longDuration / (60 * 1000))) - hour * 60;
        var sec = (parseInt(longDuration / 1000)- hour * 60 * 60 - min * 60);

        if (hour == 0) {
            if (min == 0) {
                if (sec == 0) {
                    return "00:00:00";
                } else {
                    return "00:00:" + (sec < 10 ? "0" + sec : sec);
                }
            } else {
                if (sec == 0) {
                    return "00:" + (min < 10 ? "0" + min : min) + ":00";
                } else {
                    return "00:" + (min < 10 ? "0" + min : min) + ":"
                        + (sec < 10 ? "0" + sec : sec);
                }
            }
        } else {
            if (min == 0) {
                if (sec == 0) {
                    return (hour < 10 ? "0" + hour : hour) + ":00:00";
                } else {
                    return (hour < 10 ? "0" + hour : hour) + ":00:"
                        + (sec < 10 ? "0" + sec : sec);
                }
            } else {
                if (sec == 0) {
                    return (hour < 10 ? "0" + hour : hour) + ":"
                        + (min < 10 ? "0" + min : min) + ":00";
                } else {
                    return (hour < 10 ? "0" + hour : hour) + ":"
                        + (min < 10 ? "0" + min : min) + ":"
                        + (sec < 10 ? "0" + sec : sec);
                }
            }
        }
    };

    var linusStatusTip_ = {
        show: function(containerid){
            var analyzeObj = $('#' + containerid + '>.progressing');
            if(analyzeObj.length==0){
                var html = '<div class="progressing" style="position:absolute;left:5px;top:'+($('#'+containerid).position().top)+'px;background-color:#FFF;width:100%; height:100%;z-index:30000;opacity:.60; filter: alpha(opacity=60); -moz-opacity: 0.6;">' +
                    '<div id="progressing_sub" style="position:absolute;left:45%;top:15%;z-index:30001;">'+
                    '<img src="'+SERVER_PATH+'page/meetingx/cms/js/images/loading.gif" border="0"></img>'+
                    '<span style="font-weight:bold;position:absolute;left:40px;top:10px;z-index:30002;width:600px;" matsExt="jobStatus">loading...</span>' +
                    '</div>'+
                    '</div>';
                $('#'+containerid).append(html);
            }else{
                analyzeObj.find('img').attr('src', SERVER_PATH+'page/meetingx/cms/js/images/loading.gif');
                analyzeObj.show();
            }
            return statusTip_;
        },

        hide: function(containerid, delay){
            if(delay) {
                setTimeout("$('#' + containerid + '>.progressing').hide()", delay);
            } else {
                $('#' + containerid + '>.progressing').hide();
            }
            return statusTip_;
        },

        showMaskLayer: function(containerid) {
            var layer = $('#' + containerid + '> .mask');
            if(layer.length==0){
                var html = '<div class="mask" style="position:absolute;left:5px;top:'+($('#'+containerid).position().top)+'px;background-color:#FFF;width:100%; height:100%;z-index:30000;opacity:.60; filter: alpha(opacity=60); -moz-opacity: 0.6;"></div>';

                $('#'+containerid).append(html);
            } else {
                layer.show();
            }
        },

        hideMaskLayer: function(containerid) {
            $('#' + containerid + '> .mask').hide();
        }

    };

    var analyzePstnCall4Cache_ = function(cdrObj, d){
        // from cache @2016/07/21
        var useCache = false;
        if ($('#jobSseq').val() != null && $('#jobSseq').val() != '' && isSameHash()) {
            cache_.jobSseq = $('#jobSseq').val();
            if (!cache_.sparkUcJobSseqMapped) {
                cache_.sparkUcJobSseqMapped = {};
                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
            }
            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
            for (var i = 0; i < sseqMappeds.length; i++) {
                sseqMapped = sseqMappeds[i];
                if (cdrObj.cdrId == sseqMapped.cdrId && cdrObj.dateTimeOrigination == sseqMapped.dateTimeOrigination
                    && cdrObj.dateTimeDisconnect == sseqMapped.dateTimeDisconnect && cdrObj.localSessionID == sseqMapped.localSessionID
                    && cdrObj.remoteSessionID == sseqMapped.remoteSessionID
                    && !!sseqMapped.iCuspSipCallId && !!sseqMapped.isOpenChart) {
                    if(('COMMON_WEBEX_TRUNK,COMMON_WEBEX_BTS_PSTN_TRUNK,COMMON_WEBEX_PRO_PSTN_TRUNK'.indexOf(d.called_deviceName)>=0)
                        ||'COMMON_WEBEX_TRUNK,COMMON_WEBEX_BTS_PSTN_TRUNK,COMMON_WEBEX_PRO_PSTN_TRUNK'.indexOf(d.calling_deviceName)>=0){
                        /*$('#callflow_'+cdrObj.cdrId).html('<b>show cache job...</b>');*/
                        analyzePstnCallStatusTimer_(cdrObj.cdrId, sseqMapped.iCuspSipCallId, sseqMapped.jobSseq);
                        useCache = true;
                        break;
                    }
                }
            }
        }
    }

    var analyzePstnCall_ = function(srcEmt){
        var cdrObj = getMatsValue_($(srcEmt).parent().parent().parent());
        var sessionObj = getSelectedRow_($('#sessionTab'));

        $('#callflow_'+cdrObj.cdrId).html('<b>submit job...</b>');

        // from cache @2016/2/1
        var useCache = false;
        if ($('#jobSseq').val() != null && $('#jobSseq').val() != '' && isSameHash()) {
            cache_.jobSseq = $('#jobSseq').val();
            if (!cache_.sparkUcJobSseqMapped) {
                cache_.sparkUcJobSseqMapped = {};
                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
            }
            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
            for (var i = 0; i < sseqMappeds.length; i++) {
                sseqMapped = sseqMappeds[i];
                if (cdrObj.cdrId == sseqMapped.cdrId && cdrObj.dateTimeOrigination == sseqMapped.dateTimeOrigination
                    && cdrObj.dateTimeDisconnect == sseqMapped.dateTimeDisconnect && cdrObj.localSessionID == sseqMapped.localSessionID
                    && cdrObj.remoteSessionID == sseqMapped.remoteSessionID && sessionObj.matsSessionId == sseqMapped.matsSessionId
                    && sseqMapped.iCuspSipCallId) {
                    analyzePstnCallStatusTimer_(cdrObj.cdrId, sseqMapped.iCuspSipCallId, sseqMapped.jobSseq);
                    useCache = true;
                    break;
                }
            }
        }
        if (!useCache) {
            $.ajax({
                type: "POST",
                url: SERVER_MVC_PATH + 'sparkuc/cdr/callflow/pstn',
                dataType: 'json',
                cache: false,
                data:{
                    cdrId:cdrObj.cdrId,
                    startTime:cdrObj.dateTimeOrigination,
                    endTime:cdrObj.dateTimeDisconnect,
                    localSessionID:cdrObj.localSessionID,
                    remoteSessionID:cdrObj.remoteSessionID,
                    matsSessionid:sessionObj.matsSessionId,
                    called_partyNumber:cdrObj.called_partyNumber
                },
                success: function(resultObj, textStatus){
                    if(resultObj){
                        //query job status
                        if(FW.statusCode.success===resultObj.status){
                            // @2016/2/1
                            if (!cache_.sparkUcJobSseqMapped) {
                                cache_.sparkUcJobSseqMapped = {};
                                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                            }
                            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
                            var sseqMapped = {};
                            sseqMapped.cdrId = cdrObj.cdrId;
                            sseqMapped.dateTimeOrigination = cdrObj.dateTimeOrigination;
                            sseqMapped.dateTimeDisconnect = cdrObj.dateTimeDisconnect;
                            sseqMapped.localSessionID = cdrObj.localSessionID;
                            sseqMapped.remoteSessionID = cdrObj.remoteSessionID;
                            sseqMapped.matsSessionId = sessionObj.matsSessionId;
                            sseqMapped.jobSseq = resultObj.extMsg;
                            sseqMapped.sseqType = 'PSTN_CALL';
                            sseqMapped.iCuspSipCallId = resultObj.msg;
                            sseqMappeds.push(sseqMapped);

                            analyzePstnCallStatusTimer_(cdrObj.cdrId, resultObj.msg, resultObj.extMsg);
                        }else{
                            var srcEmtId = 'callflow_'+cdrObj.cdrId;
                            $('#'+srcEmtId).html('<font color="red">'+resultObj.msg+'</font>');
                            sparkUC.statusTip.update('<font color="red">'+resultObj.extMsg+'</font><br /><button onclick="sparkUC.statusTip.hide()" style="margin-left:20px;" class="btn btn-warning btn-xs">Close</button>').show().stopRoll();
                        }
                    }
                },
                error: UIHelper.ajaxErr
            });
        }
    };
    var analyzePstnCallStatusTimer_ = function(cdrId, iCuspSipCallId, sseq){
        $('#callflow_'+cdrId).html('<b>analyzing...<b>');
        cache_.timer.pstnCall[cdrId] = window.setInterval(analyzePstnCallStatus_, 10*1000, cdrId, iCuspSipCallId, sseq);
    };
    var analyzePstnCallStatus_ = function(cdrId, iCuspSipCallId, sseq){
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/cdr/callflow/pstn/status',
            dataType: 'json',
            data:{
                sseq:sseq
            },
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj){
                    if(resultObj.extMsg==='true'){//finish analyze
                        window.clearInterval(cache_.timer.pstnCall[cdrId]);
                        $('#callflow_'+cdrId).html("<a href='"+SERVER_MVC_PATH+ "sparkuc/cdr/callflow/pstn/"+cdrId+"/"+iCuspSipCallId+"' target='_blank'>Open Chart</a>");
                        // @2016/07/22
                        if (!cache_.sparkUcJobSseqMapped) {
                            cache_.sparkUcJobSseqMapped = {};
                            cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                        }
                        sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
                        if (!!sseqMappeds) {
                            for (var i = 0; i < sseqMappeds.length; i++) {
                                sseqMapped = sseqMappeds[i];
                                if (cdrId == sseqMapped.cdrId && iCuspSipCallId == sseqMapped.iCuspSipCallId) {
                                    sseqMapped.isOpenChart=true;
                                    break;
                                }
                            }
                        }
                    }else{
                        $('#callflow_'+cdrId).html('<b>analyzing...<b>');
                    }
                }
            },
            error: UIHelper.ajaxErr
        });
    };

    var analyzeMediaStatsStatusTimer_ = function(wbxTrackingID,sSeq,wbxConfId){
        $('#callflow_linus_'+wbxTrackingID).html('pending...');
        // $('#callflow_edonus_'+wbxTrackingID).html('pending...');
        //cache_.timer.mediaStats=[];
        //analyzeMediaStatsStatus_(wbxTrackingID,sSeq,wbxConfId);
        cache_.timer.mediaStats[sSeq] = window.setInterval(analyzeMediaStatsStatus_, 3*1000, wbxTrackingID, sSeq,wbxConfId);
    };

    var analyzeMediaStatsStatus_ = function(wbxTrackingID,sSeq,wbxConfId){
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/analyzeMediaStatsStatus/'+wbxTrackingID,
            dataType: 'json',
            data:{
                sSeq:sSeq,
                wbxConfId:wbxConfId
            },
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj){
                    var extMsg=resultObj.extMsg;
                    var results=resultObj.results;
                    var type="";
                    var bool = sSeq.indexOf("linus");
                    if(bool>0){
                        type="linus";
                    }else{
                        type="edonus";
                    }
                    var targetObj = $('#callflow_'+type+'_'+wbxTrackingID);
                    if(results!= null && results.length > 0){
                        var dtos = resultObj.results[0];
                        var statusName = dtos.statusName4Html;
                        statusName = statusName.replace(/"/ig,"");
                        if(!$.isEmptyObject(statusName)){
                            targetObj.html(statusName);
                        }
                        if(dtos.status==2){
                            window.clearInterval(cache_.timer.mediaStats[sSeq]);
                            if(extMsg=="true"){
                                targetObj.html("<a href='../meetingx/cmr/linusMediaStatsForCmr4.jsp?wbxConfId="+encodeURIComponent(wbxConfId)+"&trackingId="+encodeURIComponent(wbxTrackingID)+"' target='_blank'>Open Chart</a>");
                            }else{
                                targetObj.html("No Media Stats");
                            }
                        }else if(dtos.status != 2 && extMsg=="true"){
                            targetObj.html("<a href='../meetingx/cmr/linusMediaStatsForCmr4.jsp?wbxConfId="+encodeURIComponent(wbxConfId)+"&trackingId="+encodeURIComponent(wbxTrackingID)+"' target='_blank'>Open Chart</a>");
                        }
                        if(statusName.indexOf('fail')>0){
                            window.clearInterval(cache_.timer.mediaStats[sSeq]);
                            targetObj.html("<span style='color:red'>"+dtos.desc+"</span>");
                        }
                    }else{
                        if(extMsg=="true"){
                            window.clearInterval(cache_.timer.mediaStats[sSeq]);
                            targetObj.html("<a href='../meetingx/cmr/linusMediaStatsForCmr4.jsp?wbxConfId="+encodeURIComponent(wbxConfId)+"&trackingId="+encodeURIComponent(wbxTrackingID)+"' target='_blank'>Open Chart</a>");
                        }
                    }
                }
            },
            error: UIHelper.ajaxErr
        });
    };

    var analyzeCallFlow4Cache_ = function(matsSessionId, startTimeLong, endTimeLong){
        // from cache @2016/2/1
        var useCache = false;
        if ($('#jobSseq').val() != null && $('#jobSseq').val() != '' && isSameHash()) {
            cache_.jobSseq = $('#jobSseq').val();
            cache_.sparkUcJobSseqMapped = cache_.sparkUcJobSseqMapped|| {sseqMappeds:[]};
            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
            if (!!sseqMappeds) {
                for (var i = 0; i < sseqMappeds.length; i++) {
                    sseqMapped = sseqMappeds[i];
                    if (matsSessionId == sseqMapped.matsSessionId /*&& startTimeLong == sseqMapped.startTimeLong
                     && endTimeLong == sseqMapped.endTimeLong*/) {
                        $(FW.util.getDom('callflow_'+matsSessionId)).html('<div class="link_icon link_wait"></div>Pending');
                        queryAnalyzeCallFlowStatusTimer_(sseqMapped.jobSseq, matsSessionId);
                        useCache = true;
                        break;
                    }
                }
            }
        }
    }
    var analyzeCallFlow_ = function(matsSessionId, startTimeLong, endTimeLong, sourceParty){
        $(FW.util.getDom('callflow_'+matsSessionId)).html('<div class="link_icon link_wait"></div>Pending');
        // from cache @2016/2/1
        var useCache = false;
        if ($('#jobSseq').val() != null && $('#jobSseq').val() != '' && isSameHash()) {
            cache_.jobSseq = $('#jobSseq').val();
            if (!cache_.sparkUcJobSseqMapped) {
                cache_.sparkUcJobSseqMapped = {};
                cache_.sparkUcJobSseqMapped.sseqMappeds = [];
            }
            sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
            if (!!sseqMappeds) {
                for (var i = 0; i < sseqMappeds.length; i++) {
                    sseqMapped = sseqMappeds[i];
                    if (matsSessionId == sseqMapped.matsSessionId /*&& startTimeLong == sseqMapped.startTimeLong
                     && endTimeLong == sseqMapped.endTimeLong*/) {
                        queryAnalyzeCallFlowStatusTimer_(sseqMapped.jobSseq, matsSessionId);
                        useCache = true;
                        break;
                    }
                }
            }
        }

        if (!useCache) {
            $.ajax({
                type: "POST",
                url: SERVER_MVC_PATH + 'sparkuc/session/callflow/'+sourceParty+'/'+matsSessionId+'/'+startTimeLong+'/'+endTimeLong,
                data: '{}',
                dataType: 'json',
                cache: false,
                success: function(resultObj, textStatus){
                    if(FW.statusCode.success===resultObj.status){
                        // @2016/2/1
                        if (!cache_.sparkUcJobSseqMapped) {
                            cache_.sparkUcJobSseqMapped = {};
                            cache_.sparkUcJobSseqMapped.sseqMappeds = [];
                        }
                        sseqMappeds = cache_.sparkUcJobSseqMapped.sseqMappeds;
                        var sseqMapped = {};
                        sseqMapped.matsSessionId = matsSessionId;
                        sseqMapped.startTimeLong = startTimeLong;
                        sseqMapped.endTimeLong = endTimeLong;
                        sseqMapped.jobSseq = resultObj.msg;
                        sseqMapped.ssesType = 'SESSION_CALLFLOW';
                        sseqMappeds.push(sseqMapped);

                        queryAnalyzeCallFlowStatusTimer_(resultObj.msg, matsSessionId);
                    }else{
                        alert(resultObj.msg);
                        $(FW.util.getDom('callflow_'+matsSessionId)).html('analyze fail');
                    }
                },
                error: UIHelper.ajaxErr
            });
        }
    };

    var sparkEventAnalysis_ = function(matsSessionId, userId){
        //$(FW.util.getDom('callflow_1'+matsSessionId)).html('<div class=""></div>Pending');

        // adjust chart width
        var tr = $('#callflow_1' + matsSessionId).parent().parent().get(0);
        tr = $(tr);
        var trWidth = tr.width();
        console.log(trWidth);
        // $('#content').width(trWidth);

        //getChartData();
        if (/*$('#content').length > 0*/ tr.next('#content').length > 0) {
            /*tr.after($('#content'));*/
            tr.next('#content').toggle();
        } else {
            $('#sparkEventDiv').append('<div id="content" style="display: none;"></div>');
            // var content = $('#sparkEventDiv').find('#content').get(0);

            $('#progress').show();

            getChartData(matsSessionId);

            //var content = $('#sparkEventDiv').find('#content').get(0);

            /*tr.after($(content));
             tr.next('#content').show();*/
        }

    };

    var openCMRWindow_ = function(webExConfId) {
        UIHelper.openFullWin('../meeting/confreq.jsp?reqindex=15&keyword='+encodeURIComponent(webExConfId), '');
    };

    var loadTipInfo_ = function(matsSessionId,matsJobId,startTimeLong, endTimeLong, isSpark){
        if(isSpark) {
            UIHelper.openFullWin('../meetingx/sparkuc/sparkSessionquality.jsp?matsSessionId='+encodeURIComponent(matsSessionId),'');
        } else {
            UIHelper.openFullWin('../meetingx/sparkuc/sessionquality.jsp?matsSessionId='+encodeURIComponent(matsSessionId)+'&matsJobId='+encodeURIComponent(matsJobId)+'&startTimeLong='+startTimeLong+'&endTimeLong='+endTimeLong,'');
        }
    };


    var loadSessionTipInfo_ = function(localSessionID,remoteSessionID){
        var divTipTitle=  'Sessions', divTipWidth = 300;
        var divTipPosition = 'rt';
        var srcEmt=FW.util.getEventSrcElement();
        var tbody='<table><tr><td>localSessionID:</td><td>'+
            localSessionID+'</td></tr><tr><td>remoteSessionID:</td><td>'+
            remoteSessionID+'</td></tr></table>';
        divTip.open({title:divTipTitle, body:tbody, srcElement:srcEmt, width:divTipWidth, position:divTipPosition});
    };

    var queryAnalyzeCallFlowStatusTimer_ = function(sseq, matsSessionId){
        queryAnalyzeCallFlowStatus_(sseq, matsSessionId);
        cache_.timer.sessCallFlow[matsSessionId] = window.setInterval(queryAnalyzeCallFlowStatus_, 5*1000, sseq, matsSessionId);
    };
    var queryAnalyzeCallFlowStatus_ = function(sseq, matsSessionId){
        $.ajax({
            type: "GET",
            url: SERVER_MVC_PATH + 'sparkuc/analyzeStatus/'+sseq,
            dataType: 'text',
            cache: false,
            success: function(resultObj, textStatus){
                if(resultObj){
                    resultObj = JSON.parse(resultObj);
                    var statusName = resultObj.statusName4Html;
                    statusName = statusName.replace(/"/ig,"");
                    var targetObj = $(FW.util.getDom('callflow_'+matsSessionId));
                    if(!$.isEmptyObject(statusName)){
                        targetObj.html(statusName);
                    }

                    if(resultObj.status==2||statusName.indexOf('fail')>0){
                        window.clearInterval(cache_.timer.sessCallFlow[matsSessionId]);
                        if(resultObj.status==2){
                            var tmpHtml = "<a href='"+SERVER_MVC_PATH+ "sparkuc/session/callflow2/"+matsSessionId+"' target='_blank'>Open Chart</a>";
                            if(resultObj.desc_ext==='true'){
                                tmpHtml += "&nbsp;&nbsp;&nbsp;<a href='"+SERVER_PATH+ "page/meetingx/plugin/scriptOutput.jsp?key="+encodeURIComponent(sseq)+"' target='_blank'>Script Output</a>";
                            }
                            targetObj.html(tmpHtml);
                        }else{
                            targetObj.html('<a href="javascript:void(0)">'+statusName+'</a>');
                            cache_[matsSessionId] = {};
                            $.extend(cache_[matsSessionId], {jobDesc:resultObj.desc});

                            targetObj.find('a:first').click(function(){
                                var thisObj = $(this);
                                var desc = cache_[matsSessionId].jobDesc;
                                divTip.open({id:'callflow_'+matsSessionId.replace('-','_')+'_tip', srcElement:this, title:thisObj.html(), body:desc.replace(/\n/ig, '<br/>'), width:419, height:300});
                            });
                        }
                    }
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                console.log(XMLHttpRequest);
                console.log(errorThrown);
            }
        });
    };

    var querySelect_ = function(){


        if($('#selectcalls').parent().hasClass('active')){
            query_();
        }
        else if($('#selectdevices').parent().hasClass('active')){
            searchDevice_();
        }
    };

    var valueChange4InputInUI_ = function(src){
        var sparkCallTipObj = $('#sparkCallTip'), sparkMsgTipObj = $('#sparkMsgTip');
        var sparkCallTip = {color:'', msg:[]}, sparkMsgTip = {color:'', msg:[]};

        var uuidReg = /^[a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}$/;
        var trackingIDReg = /([a-fA-F0-9]{8}(-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12})|(^L2Sip_)/;
        var userField = $("#userEmail").val();

        if(userField.length > 0) { // not email address
            if(!uuidReg.test(userField)) {    // not uuid
                if(trackingIDReg.test(userField)) {    // contains uuid, then take it as tracking id.
                    sparkCallTip.color = "red";
                    sparkCallTip.msg.push("Search field \"User\" does not apply");
                }
            }
        }

        if($('#numCallingParty').val()){
            sparkMsgTip.color = "red";
            sparkMsgTip.msg.push("Search field \"Calling number/URI\" does not apply");
        }
        if($('#deviceCallingParty').val()||$('#deviceCalledParty').val()){
            sparkMsgTip.color = "red";
            sparkMsgTip.msg.push("Search field \"Device\" does not apply");
        }
        if($('#startTime').val()||$('#endTime').val()){
            var startTimeObj = new Date($('#startTime').val().replace(/-/g, '/'));
            var endTimeObj = new Date($('#endTime').val().replace(/-/g, '/'));
            var tmp = endTimeObj.getTime()-startTimeObj.getTime();
            if(tmp>=14*24*60*60*1000){
                if(sparkMsgTip.color!="red")
                    sparkMsgTip.color = "yellow";
                sparkMsgTip.msg.push("Time range outside of 14 day limit");

                if(tmp>28*24*60*60*1000){
                    sparkCallTip.color = "red";
                    sparkCallTip.msg.push("Time range outside of 28 day limit");
                }
            }
        }

        if(sparkCallTip.color==''){
            sparkCallTip.color="green";
            sparkCallTip.msg.push("Current filter settings will be used to search Spark Call");
        }
        if(sparkMsgTip.color==''){
            sparkMsgTip.color="green";
            sparkMsgTip.msg.push("Current filter settings will be used to search Spark Message");
        }

        sparkCallTipObj.attr("fill",sparkCallTip.color).attr("tip",sparkCallTip.msg.join('<br/>'));
        sparkMsgTipObj.attr("fill",sparkMsgTip.color).attr("tip",sparkMsgTip.msg.join('<br/>'));
    };

    var mouseover4circleInUI_ = function(srcName){
        var ev = FW.util.getEvent();
        var tip = srcName.getAttribute("tip");
        MatsExtTags.popTips({name: 'allTipInOne'}).popup({position: {left: ev.clientX, top: ev.clientY}, body: tip});
    };

    var showTrackingIds_= function(srcElement) {
        var cdrObj = getMatsValue_($(srcElement).parent().parent());
        if(!cdrObj.trackingIds) {
            return;
        }
        var msg = '<strong>Tracking ID: </strong><br/>';
        var trackingIDArr = cdrObj.trackingIds.split(",");
        var cnt = trackingIDArr.length;
        for(var i = 0; i < cnt; i++) {
            msg = msg + trackingIDArr[i] + '<br/>';
        }
        var ev = FW.util.getEvent();
        MatsExtTags.popTips({name: 'allTipInOne'}).popup({position: {left: ev.clientX, top: ev.clientY}, body: msg});
    };

    return {
        init: init_,
        query:query_,
        snapshotCreate: snapshotCreate_,
        deving:deving_,
        reset: reset_,
        viewDeviceLog: viewDeviceLog_,
        openwindow: openwindow_,
        closeDivWin: closeDivWin_,
        retrieveSparkDeviceLog: retrieveSparkDeviceLog_,
        retrieveLogWithTicket: retrieveLogWithTicket_,
        stopTimer: stopTimer_,
        searchDevice: searchDevice_,
        querySelect: querySelect_,
        analyzePstnCall: analyzePstnCall_,
        openwindow4trackingidlist:openwindow4trackingidlist_,
        analyzeCallFlow: analyzeCallFlow_,
        sparkEventAnalysis: sparkEventAnalysis_,
        loadTipInfo: loadTipInfo_,
        loadSessionTipInfo: loadSessionTipInfo_,
        renderStartEndTime:renderStartEndTime_,
        retrieveLog: retrieveLog_,
        openCMRWindow: openCMRWindow_,
        statusTip: statusTip_,
        loadSessionData: loadSessionData_,
        valueChange4InputInUI: valueChange4InputInUI_,
        mouseover4circleInUI: mouseover4circleInUI_,
        recordViewLogUserBehavior:recordViewLogUserBehavior_,
        showTrackingIds : showTrackingIds_
    };
}();

var beforeLoadMatsTabView = function(){
    sparkUC.stopTimer();
};

var paging = function(){
    var count, pageSize, totalPageNum, currPageNum=1, parentContainer;
    var pageNoBtnSize = 6;
    var hrefColor = '#448cca', textColor = '#666';
    var onChangePageNumCallback;

    var init_ = function(c, size, onChangePageNum, parentObj){
        parentContainer = parentObj||$('body');
        onChangePageNumCallback = onChangePageNum||function(pageNum, limit){};

        count = c;pageSize = size;
        currPageNum = 1;
        totalPageNum = (count%pageSize==0)?(count/pageSize):(Math.floor(count/pageSize)+1);

        parentContainer.find('span[matsExt="totalrecs"]').html(c);
        renderPagingUI_(currPageNum, true);
    };

    var renderPagingUI_ = function(pageNum, isOnlyRenderUI){
        if(pageNum<=0||pageNum>totalPageNum) return;

        currPageNum = pageNum;

        var from = (pageNum-1) * pageSize + 1;
        var to = (pageNum * pageSize) > count ? count : (pageNum * pageSize);

        parentContainer.find('span[matsExt="from"]').html(from);
        parentContainer.find('span[matsExt="to"]').html(to);
        parentContainer.find('button[matsExt="previous"]').attr("disabled", false);
        parentContainer.find('button[matsExt="next"]').attr("disabled", false);

        if(currPageNum==1) {
            parentContainer.find('button[matsExt="previous"]').attr("disabled", true);
        }
        if(currPageNum==totalPageNum) {
            parentContainer.find('button[matsExt="next"]').attr("disabled", true);
        }

        var pageNumberBtnSize = totalPageNum > pageNoBtnSize ? pageNoBtnSize : totalPageNum;
        var medianNo = currPageNum;

        $('a[matsExt="pageNo"]', parentContainer).remove();

        var start = medianNo - Math.ceil(pageNumberBtnSize/2) + 1;
        start = start > 0 ? start : 1;
        var end = start + pageNumberBtnSize;

        if(end > (totalPageNum+1)) {
            end = totalPageNum + 1;
            start = end - pageNumberBtnSize;
        }

        for(var i = start; i < end; i++) {
            var pageNumberBtn = $('<a href="javascript:void(0);" class="page_number" matsExt="pageNo"></a>');
            pageNumberBtn.text(i);
            pageNumberBtn.insertBefore($('button[matsExt="next"]', parentContainer));
        }

        parentContainer.find('a[matsExt="pageNo"]').each(function(i){
            $(this).removeClass();
            if($(this).text() == currPageNum) {
                $(this).addClass("page_number_select");
            } else {
                $(this).addClass("page_number");
            }
            return true;
        });

        //init event
        var onclickList = {first:first_, previous:previous_, next:next_, last:last_, pageNo:go_};
        parentContainer.find('[matsExt]').each(function(i, dom){
            var matsExt = $(dom).attr('matsExt');
            if(onclickList[matsExt]){
                //$(dom).click(onclickList[matsExt]);
                dom.onclick = onclickList[matsExt];
            }

        });

        //fire call event
        if(isOnlyRenderUI!==true){
            onChangePageNumCallback(currPageNum, pageSize);
        }
    };

    var first_ = function(){
        renderPagingUI_(1);
    };
    var previous_ = function(){
        renderPagingUI_(currPageNum-1);
    };
    var next_ = function(){
        renderPagingUI_(currPageNum+1);
    };
    var last_ = function(){
        renderPagingUI_(totalPageNum);
    };
    var go_ = function(){
        var pageNo = parseInt($(this).text());
        if(pageNo<=0 || pageNo>totalPageNum){
            alert("Please input correct number!");
            return;
        }
        renderPagingUI_(pageNo);
    };

    return {
        init: init_,
        first: first_,
        previous: previous_,
        next: next_,
        last: last_,
        go: go_
    };
}


FusionCharts.ready(function () {

    //alert(123);
    /*$('#progress').show();
     getChartData();*/
});

function getChartData(matsSessionId) {
    // var uidList = $("div[name='TelChartContainer']");
    // if(uidList.length>0){
    //    // alert(uidList.length);
    //     for(var i = 0; i < uidList.length; i++) {
    var chart = {};
    chart.type="hlineargauge";
    chart.renderAt="";
    chart.width="100%";
    chart.height="100%";
    chart.caption='';
    chart.theme='fint';
    chart.showValue='0';
    //
    //         chartsProps.push(chart);
    //     }
    // }
    // alert(chartsProps.length);
    //  for(var i = 0; i < chartsProps.length; i++) {
    //      var chart = chartsProps[i];
    requestChartData(chart, matsSessionId);
    //alert(chart.uid);
    // }

}

function requestChartData(chart, matsSessionId) {
    var locusId=$("#locusId").val();
    var locusTimestamp=$("#locusTimestamp").val();
    // alert(timeZone);
    $.ajax({
        url: $("#contextPath").val() + '/rest/sparkuc/eventanalysischart'/* + '?locusId=' + locusId + '&locusTimestamp=' + locusTimestamp*/,
        type: 'GET',
        data: {locusId:locusId,locusTimestamp:locusTimestamp},
        dataType: 'json',
        success: chartClosure(chart, matsSessionId),
        error: function(jqXHR, textStatus, errorThrown) {
            alert('Load data Error!')
        },
        complete: function(jqXHR, textStatus ) {
            //console.log('chart monthly complete.');
        }
    });
}

function chartClosure(chart, matsSessionId) {
    return function(data, textStatus, jqXHR) {
        // $('#progress').hide();
        rendChart(data, chart, matsSessionId);
    }
}

var sparkEventCache = {};

var filterSparkEvent = function (btn, matsSessionId) {
    var data = sparkEventCache['data_' + matsSessionId];
    var chart = sparkEventCache['chart_' + matsSessionId];
    var eventFilterBtn = $('#callflow_3_' + matsSessionId);
    console.log($(btn).attr('class'));
    var chbs = $(btn).find('input[type=checkbox]');
    chbs = chbs || [];
    for (var i = 0; i < chbs.length; i++) {
        var chb = chbs[i];
        console.log($(chb).attr('checked') + " " + chb);
        if ($(chb).attr('checked')) {
            $(chb).attr('checked', false);
        } else {
            $(chb).attr('checked', true);
        }
        // $(chb).attr('checked', true);
    }
    // var eventFilterBtn = $(btn);
    var eventFilterDiv = eventFilterBtn.parent();
    var checkeds = eventFilterDiv.find('input[type=checkbox]:checked');
    console.log('checked: ' + checkeds);
    var eventNames = [];
    for (var i = 0; i < checkeds.length; i++) {
        eventNames.push($(checkeds[i]).val());
    }

    rendChart(data, chart, matsSessionId, eventNames);
}

function pad4SparkEvent(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function unique4SparkEvent(arr, prop) {
    var ret = [];
    var hash = {};

    for (var i = 0; i < arr.length; i++) {
        var item = arr[i];
        if (prop != null) {
            var key = typeof(item) + item[prop];
        } else {
            var key = typeof(item) + item;
        }

        if (hash[key] !== 1) {
            ret.push(item);
            hash[key] = 1;
        }
    }

    return ret;
}

var sparkEventChartClick = function(participantId) {

    var locusId=$("#locusId").val();
    var locusTimestamp=$("#locusTimestamp").val();

    $('#progress').show();

    $.ajax({
        url: $("#contextPath").val() + '/rest/sparkuc/eventanalysis'/* + '?locusId=' + locusId + '&locusTimestamp=' + locusTimestamp + '&participantId=' + participantId*/,
        type: 'GET',
        data: {locusId:locusId,locusTimestamp:locusTimestamp,participantId:participantId},
        dataType: 'html',
        success: rendEventClosure(),
        error: function(jqXHR, textStatus, errorThrown) {
            alert('sparkEventChartClick: Load data Error!' + errorThrown + textStatus);
        },
        complete: function(jqXHR, textStatus ) {
            //console.log('chart monthly complete.');
        }
    });
}

function rendEventClosure() {
    return function(data, textStatus, jqXHR) {
        $('#progress').hide();
        rendEvent(data);
    }
}

var rendEvent = function(data) {
    var list = data || [];
    // alert(list.length);
    var contentPath = $("#contextPath").val();
    $(modalDialogTpl).appendTo('body');
    $('#sparkEventWindow .modal-body').empty();
    $('#sparkEventWindow .modal-body').append(data);

    $('#sparkEventWindow h4.modal-title').text("Spark Call Event Analysis");
    $('#sparkEventWindow').modal();

}

var modalDialogTpl = '<div class="modal fade" style="top:100px;" id="sparkEventWindow" tabindex="-1" role="dialog">' +
    '   <div class="modal-dialog modal-lg" style="width: 80%; !important;">' +
    '     <div class="modal-content">' +
    '       <div class="modal-header">' +
    '         <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
    '         <h4 class="modal-title" style="font-size:14px;color:#606060;font-family:Cisco Sans Reg;font-weight:bold;"></h4>' +
    '       </div>' +
    '       <div class="modal-body" style="height:600px;overflow:scroll;">' +
    '       </div>' +
    '     </div>' +
    '   </div>' +
    '</div>';


//---------***  render chart   ****-----------/
var rendChart = function(data, chart, matsSessionId, eventNames) {
    sparkEventCache['data_' + matsSessionId] = JSON.parse(JSON.stringify(data))  /*data.slice(0)*/ /*jQuery.extend(true, {}, data)*/;
    sparkEventCache['chart_' + matsSessionId] = chart;

    var returnDate = JSON.parse(JSON.stringify(data));

    console.log("chart return data",returnDate);

    $('#eventTimeSeq button').remove();

    //detail button
    var etsShowTableBtn = '<input type="button" style="position:absolute;left:0%;top:0" class="btn btn-info btn-sm" id="' + 'callflow_4_' + matsSessionId + '" onclick="sparkEventChartClick(\'' + d.participantId + '\')"' + ' value="Show Detail"' + '/>';
    $('#eventTimeSeq').append(etsShowTableBtn);

    //var contentPath = $("#contextPath").val();
    var tr = $('#callflow_1' + matsSessionId).parent().parent();


    if(returnDate !="" && returnDate != undefined){
        renderSatterChart (returnDate.minTime, returnDate.maxTime,returnDate.xAxisDatas,returnDate.yAxisDatas,returnDate.legendDatas,returnDate.seriesDatas,returnDate.userSummary);
    }

    $('#eventTimeSeq').show();


    tr.after( $('#eventTimeSeq'));
    $('#eventTimeSeq').wrap("<tr></tr>").wrap("<td colspan='9'></td>");
    ;
    // content.show();
    $('#progress').hide();

};




function renderSatterChart (minTime, maxTime,xAxisData,yAxisData,legendData,seriesDatas,userSummary) {
    $("#telChartContainer").css("width",$( document ).width() -170);
    var myChart = echarts.init(document.getElementById('telChartContainer'), 'shine');
    var option = {
        title : {
            //  text: minTime+'-'+maxTime,
            // left:'5%',
            textStyle: {
                color:'#333',
                fontSize: 16,
                fontWeight:'normal',
            }
        },
        grid: {
            left: '0',
            right: '0%',
            bottom: '3%',
            containLabel: true,
        },
        tooltip : {
            // trigger: 'axis',
            showDelay : 0,
            formatter : function (params) {
                return  params.value[0]  +'<br/> '+params.seriesName ;
            },

        },
        toolbox: {
            show: true,
            itemSize: 15,
            top: 0,
            right:'1%',
            feature: {
                dataZoom: { title: {
                    zoom: 'area zooming',
                    back: 'restore area zooming',
                }
                },
                restore: {title: 'restore'}
            }
        },

        legend: {
            //  y:"bottom",
            show:true,
            top: 0,
            itemGap:20,
            itemWidth:15,
            data:legendData,
            formatter:function(name){
                return ''
            },
            tooltip: {
                show: true
            }

        },
        xAxis : [
            {
                type : 'category',
                data: xAxisData,
                position:'top',
                axisLabel : {
                    formatter: (function(value){
                        if(value != "" && value != undefined){
                            var time = value.split("T")[1];
                            return time.substr(0,time.indexOf("."));
                        }else{
                            return "--";
                        } }),
                    textStyle:{
                        color:"#000"
                    }
                },
            }
        ],
        yAxis : [
            {
                type : 'category',
                data: yAxisData,
                axisLine: {
                    show: false
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#888',
                        //   type: 'dashed'
                    }
                },
                axisLabel : {
                    formatter:function(value){
                        return value+"("+userSummary[value]+")\n { failure_reason: None }";
                    }
                },
            }
        ],
        dataZoom: [
            {
                type: 'slider',
                show: true,
                // bottom: 35,
                top:60,
                xAxisIndex: [0],
            },

            {
                type: 'inside',
                xAxisIndex: [0],
            },
            {
                type: 'inside',
                yAxisIndex: [0],
            }
        ],
        series : seriesDatas
    };

    myChart.setOption(option);
}
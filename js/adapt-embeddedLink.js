/*
 * adapt-embeddedLink
 * License - https://github.com/adaptlearning/adapt_framework/blob/master/LICENSE
 * Maintainer - Amruta Thakur <amruta.thakur@exultcorp.com>
*/

define(function(require) {

    var ComponentView = require("coreViews/componentView");
    var Adapt = require("coreJS/adapt");
    var mep = require('components/adapt-embeddedLink/js/mediaelement-and-player.min');
    var lightBox = require('components/adapt-embeddedLink/js/jquery.jsmodal');

    var EmbeddedLink = ComponentView.extend({

        events: {
            'click .embeddedLink-zoomin-button':'onClickZoomInButton',
            'click .embeddedLink-graphic-pin': 'onClickAudioButton',
            'click .embeddedLink-image':'onClickImage',
            'click .back':'onClickBack',
            'click .next':'onClickNext'
        },

        preRender: function() {
            this.initialSetUp();
        },

        initialSetUp:function(){
            this.widthChange = 0;
            var videoExtensionsList = ["mp4","ogv","ogg"];
            var imageExtensionsList = ["jpg","png","jpeg","svg","gif","bmp"];
            var extension = this.model.get("_source").split(".")[1];

            _.each(videoExtensionsList, function(videoExtension,index){
                if(extension == videoExtension){
                    this.model.set("_isVideo",true);
                }
            },this);
            _.each(imageExtensionsList, function(imageExtension,index){
                if(extension == imageExtension){
                    this.model.set("_isImage",true);
                }
            },this);

            if(this.model.get("_isVideo") == undefined && this.model.get("_isImage") == undefined){
                this.model.set("_isDocument",true);
            };
        },

        postRender: function() {

            var bodyText=this.model.get('_page').body;
            this.listenTo(Adapt,'device:changed',this.resizeDevice,this);
            this.widthChange=Adapt.device.screenWidth;
            this.listenTo(Adapt,'device:resize',function(e){
                if(this.widthChange != Adapt.device.screenWidth){
                    if(this.model.get('_hasPagination') != undefined && this.model.get('_hasPagination')){
                        this.settingForPagination(bodyText);
                    }
                }

            },this);

            this.bindInviewEvents();
            this.checkReadyStatus();
            this.settingsForAudio();
            this.resizeDevice();

            if(this.model.get("_isDocument") != undefined){
                this.$(".page-body").addClass("isDocument");
            }
            if(bodyText == ""){
                this.$('.embeddedLink-description-container').hide();
            }

            if(this.model.get('_hasPagination') != undefined && this.model.get('_hasPagination')){
                this.settingForPagination(bodyText);
                //this.$(".back").hide();
            }
        },

        bindInviewEvents:function(){
            if(Adapt.device.screenSize != 'large'){
                this.$('.embeddedLink-iframe-holder').on('inview', _.bind(this.inviewMobile, this));
            }
            this.$('.embeddedLink-description').on('inview', _.bind(this.inview, this));
        },

        settingsForAudio:function(){
            if($('html').hasClass('ie8')) {
                var audioObject=new MediaElementPlayer(this.$('audio')[0]);
                this.model.set('_audioObjectForIE',audioObject);
            }
            this.$('.mejs-container').addClass('display-none');
            this.$('audio').on('ended', _.bind(this.onAudioEnded, this));
        },

        checkReadyStatus:function(){

            if(this.model.get("_isImage")){
                this.$('.embeddedLink-image').imageready(_.bind(function() {
                    this.setReadyStatus();
                }, this));
            }
            else if(this.model.get("_isVideo")){
                if (this.model.get('_source') != "") {
                    this.setReadyStatus();
                }
            }
            else{
                if(Adapt.device.screenSize != 'large'){
                    this.$('.embeddedLink-iframe-posterImage').imageready(_.bind(function() {
                        this.setReadyStatus();
                    }, this));
                }
                else{
                    this.$('.embeddedLink-iframe').ready(_.bind(function() {
                        this.setReadyStatus();
                    },this));
                }
            }
        },

        inview: function(event, visible) {
            var addedMute = this.$('.embeddedLink-graphic-pin-icon').hasClass('icon-sound-mute');
            this.stopCurrentAudio();
            this.stopAudio();

            if (visible && !addedMute) {
                var audioElement;
                if($('html').hasClass('ie8')) {
                    audioElement=this.model.get('_audioObjectForIE');
                }
                else{
                    audioElement = this.$("audio")[0];

                }
                this.playAudioForElement(audioElement);
                if(Adapt.device.screenSize != 'large'){
                    if(this.model.get("_isVideo")){
                        this.checkCompletionStatus();
                    }
                }
            }
            else{
                this.stopCurrentAudio();
                this.stopAudio();
            }
        },

        inviewMobile:function(event, visible){

            if(visible){
                this.checkCompletionStatus();
            }
        },

        settingForPagination:function(bodyText){
            var bodyTextArray = bodyText.split(" ");
            var $pagebody =this.$(".page-body");
            var divCount = 1,charLength;
            var i= 0, newDivCnt=0;
            this.initialPaginationSetting($pagebody);

            while(i<bodyTextArray.length){

                if(this.$('.pageText-'+divCount)[0].scrollWidth > this.$('.pageText-'+divCount).innerWidth() || this.$('.pageText-'+divCount)[0].scrollHeight > this.$('.pageText-'+divCount).innerHeight()){
                    this.hideOverflow(divCount,bodyTextArray[i-1]);
                    i=i-2;
                    this.createDiv(++divCount);
                    ++newDivCnt;
                }
                else{
                     this.$('.pageText-'+divCount).append(bodyTextArray[i]+" ");
                }
                i++;
            }

            if(newDivCnt == 0 ){
                this.$(".embeddedLink-pagination-controls").hide();
            }
            else{
                this.$(".embeddedLink-pagination-controls").show();
            }
            var totalLength = this.$(".page-body").length;
            this.$(".total").html(totalLength);
            this.$(".paginated-div").hide();
            this.widthChange = Adapt.device.screenWidth;

            if(this.$(".icon-shrink").hasClass("icon")){
                this.$(".page-body").show();
                this.$(".embeddedLink-pagination-controls").hide();
            }
        },

        initialPaginationSetting:function(pagebody){
            pagebody.html("");
            var length = pagebody.length;
            $(pagebody[0]).show();
            if(length >1){
                for(var j=1;j<=length;j++){
                    $(pagebody[j]).remove();
                }
            }
            this.$(".current").html("1");
            this.$(".total").html("1");
            this.$(".back").hide();
            this.$(".next").show();
        },

        hideOverflow:function(divCount,bodyText){
            var text = this.$('.pageText-'+divCount).html();
            var cnt =text.length - bodyText.length-1;
            text = text.substring(0,cnt);
            this.$('.pageText-'+divCount).html(text);
        },

        createDiv:function(count){

            if($(".pageText-"+count).html() == undefined){
                var div = $("<div class='paginated-div isDocument page-body pageText-"+count+"'></div>")
                this.$(".embeddedLink-description").append(div);
            }
        },

        resizeDevice:function(){
            var posterSrc = this.model.get("_posterImage");
            var source = this.model.get("_source");

            if(Adapt.device.screenSize != 'large'){
                this.settingsForMobileDevice(posterSrc);
                this.$('.embeddedLink-iframe-holder').on('inview', _.bind(this.inviewMobile, this));
            }
            else{
                this.settingsForDesktop(source);
            }
        },

        settingsForMobileDevice:function(posterSrc){

            if(this.model.get("_isImage")){
                this.$(".embeddedLink-image").attr('src',posterSrc);
                this.$(".embeddedLink-image").css('cursor','default');
                this.$(".embeddedLink-description-container").hide();
            }
            else
            {
                if(!this.model.get('_isVideo')){
                    this.$('.embeddedLink-iframe').hide();
                    this.$('.embeddedLink-iframe-posterImage').show();
                    this.$(".embeddedLink-description-container").hide();
                }
                this.$('.embeddedLink-zoomin-button').hide();
            }
        },

        settingsForDesktop:function(source){

            if(this.model.get("_isImage")){
                this.$(".embeddedLink-image").attr('src',source);
                this.$(".embeddedLink-image").css('cursor','pointer') ;
                this.$(".embeddedLink-description-container").show();
            }
            else
            {
                if(!this.model.get('_isVideo')){
                    this.$('.embeddedLink-iframe-posterImage').hide();
                    this.$('.embeddedLink-iframe').show();
                    this.$(".embeddedLink-description-container").show();
                }
                this.$('.embeddedLink-zoomin-button').show();
            }
        },

        stopAudio: function () {
            var audioObject = this.model.get('_audioObjectForIE');

            if(audioObject) {
                audioObject.setCurrentTime(0);
                audioObject.pause();
                this.model.set("_audioObjectForIE", '');
                this.$('.embeddedLink-graphic-pin-icon').addClass('icon-sound-mute');
            }
        },

        stopCurrentAudio:function(){
            var audioElement = this.model.get("_currentAudioElement");

            if (audioElement) {
                if (!audioElement.paused && audioElement.pause) {
                    audioElement.pause();
                }
                if (audioElement.currentTime != 0) {
                    audioElement.currentTime = 0.0;
                }
                this.model.set("_currentAudioElement", '');
                this.$('.embeddedLink-graphic-pin-icon').addClass('icon-sound-mute');
            }
        },

        playAudioForElement:function(audioElement){

            if (audioElement) {
                if(!$('html').hasClass('ie8')){
                    this.stopCurrentAudio();
                    this.model.set("_currentAudioElement", audioElement);
                }
                if(audioElement.play) audioElement.play();
            }
        },

        onAudioEnded: function(event) {

            if($('html').hasClass('ie8')) {
                this.stopAudio();
            } else {
                this.model.get("_currentAudioElement").currentTime = 0.0;
                this.model.set("_currentAudioElement", '');
            }
            this.$('.embeddedLink-graphic-pin-icon').addClass('icon-sound-mute');
        },

        onClickAudioButton:function(event){

            if(event && event.preventDefault) event.preventDefault();

            var audioElement;
            var isIE8 = $('html').hasClass('ie8');

            if(isIE8){
                audioElement = this.model.get("_audioObjectForIE");
            }
            else{
                audioElement = this.model.get("_currentAudioElement");
            }

            if(audioElement==''){
                if(isIE8){
                    audioElement=new MediaElementPlayer(this.$('.embeddedLink-item-audio audio')[0]);
                }
                else{
                    audioElement = this.$('.embeddedLink-item-audio audio')[0];
                }
                this.playAudioForElement(audioElement);
                this.$('.embeddedLink-graphic-pin-icon').removeClass('icon-sound-mute');
            }
            else {
                if(isIE8) {
                    this.stopAudio();
                } else {
                    this.stopCurrentAudio();
                }
                this.$('.embeddedLink-graphic-pin-icon').addClass('icon-sound-mute');
            }
        },

        onClickZoomInButton:function(event){
            event.preventDefault();
            var browser = Adapt.device.browser;
            var isLightBox=this.model.get("_isLightBox");
            var source = this.model.get("_source");

            if(browser == 'ipad'){
                this.$(".embeddedLink-lightBox-iframe-parent").css({'overflow':'auto' , '-webkit-overflow-scrolling':'touch'});
            }

            this.videoSettingOnZoomIn();

            this.lightBoxSettingOnZoomIn(isLightBox,source,event);

            if(this.model.get("_isDocument") != undefined && this.model.get("_isDocument")){
                this.documentSettingForZoomIn(event);
            }
        },

        videoSettingOnZoomIn:function(){
            //Pause all the videos on popout button clicked
            var videoPause=this.$("video");
            for(var i=0;i<videoPause.length;i++){
                videoPause[i].pause();
            }
        },

        lightBoxSettingOnZoomIn:function(isLightBox,source,event){
            var $zoomInButtonRef = $(event.currentTarget);
            var zoomIcon = $zoomInButtonRef.find('.icon');

            if(!zoomIcon.hasClass('icon-shrink')){
                if(isLightBox){
                    this.$('.embeddedLink-lightBox-popup-container').modal();
                    this.checkCompletionStatus();

                }
                else{
                    window.open(source,'_blank','width=1024,height=768,left=100,top=100');
                    this.checkCompletionStatus();
                }
            }
        },

        documentSettingForZoomIn:function(event){
            var $zoomInButtonRef = $(event.currentTarget);
            var zoomIcon = $zoomInButtonRef.find('.icon');

            if(zoomIcon.hasClass('icon-expand')){
                zoomIcon.removeClass('icon-expand');
                zoomIcon.addClass('icon-shrink');
                this.$(".embeddedLink-iframe").hide();
                this.$(".paginated-div").addClass("showAllText");
                this.$(".page-body").addClass("expandText");
                this.$(".page-body").show();
                this.$(".embeddedLink-pagination-controls").hide();
            }
            else{
                zoomIcon.removeClass('icon-shrink');
                zoomIcon.addClass('icon-expand');
                var totalLength = this.$(".page-body").length;
                this.$(".page-body").removeClass("expandText");
                this.$(".embeddedLink-iframe").show();
                this.$(".paginated-div").removeClass("showAllText");
                this.$(".paginated-div").hide();
                if(totalLength != 1){
                    this.$(".embeddedLink-pagination-controls").show();
                }
                this.$(".total").html(totalLength);
                this.$(".current").html("1");
                this.$(".back").hide();
                this.$(".next").show();
            }
        },

        onClickImage:function(event){
            event.preventDefault();
            if(Adapt.device.screenSize != 'large')return;

            var imageSource = this.model.get("_imageSource");
            window.open(imageSource,'_blank','width=1024,height=768,left=100,top=100');
            this.checkCompletionStatus();
        },

        onClickBack:function(event){
            event.preventDefault();
            var $back=$(event.currentTarget);
            var $currentPageNo = $back.parent().siblings(".embeddedLink-popup-count").find(".current");
            var textNo =$currentPageNo.text();

            this.$(".pageText-"+textNo).hide();
            $currentPageNo.html(--textNo);
            this.$(".pageText-"+textNo).show();
            if(textNo == 1){
                $back.hide();
            }
            this.$(".next").show();
        },

        onClickNext:function(event){
            event.preventDefault();
            var $next=$(event.currentTarget);
            var $currentPageNo = $next.parent().siblings(".embeddedLink-popup-count").find(".current");
            var textNo =$currentPageNo.text();

            this.$(".pageText-"+textNo).hide();
            $currentPageNo.html(++textNo);
            this.$(".pageText-"+textNo).show();
            this.$(".back").show();
            var total = this.$(".page-body").length;

            if(textNo == total){
                $next.hide();
            }
        },

        checkCompletionStatus: function() {

            if (!this.model.get('_isComplete')) {
                this.setCompletionStatus();
            }
        }

    });

    Adapt.register("embeddedLink", EmbeddedLink);

    return EmbeddedLink;

});
/*! placeholder 0.1.2
 * (c) 2012-2013 Jony Zhang <zj86@live.cn>, MIT Licensed
 * https://github.com/niceue/placeholder/
 */
(function($, undefined) {
    var phType = 1,   //控制placeholder显示方式，0：focus的时候消失，1：输入值的时候消失
        ua = navigator.userAgent.toLowerCase(), 
        check = function(r){return r.test(ua);}, 
        isIE = document.documentMode || +(navigator.userAgent.match(/MSIE (\d+)/) && RegExp.$1),
        isChrome = check(/chrome/),
        isMoz = check(/firefox/) && !check(/(compatible|webkit)/) && +(/firefox\/(\d*)/.exec(ua))[1],
        isSafari = check(/safari/) && !isChrome,
        //isOpera = navigator.appName === 'Opera', //Opera不在控制范围
        isPlaceholder = 'placeholder' in document.createElement('input'),
        inputChange = (isIE && isIE <= 8) ? function(el, fn){
            el.attachEvent('onpropertychange', function(){fn(el);});
        } : function(el, fn){
            el.addEventListener("input", function(){fn(el);}, false);
        },
        labelCls = 'ph-label', 
        focusCls = 'ph-focus',
        hideCls = 'ph-hide';
        
    function createPh(dom, css){
        var $inputs;
        if (dom) {
            $inputs = $(dom).is(':input') ? $(dom) : $(dom).find(':input');
        } else {
            $inputs = $('input,textarea');
        }
        $inputs.filter(':input[placeholder]').each(function(){
            var $el = $(this), 
                label = $el.prev('label.'+labelCls);
            if (!label.length) {
                var id = this.id, 
                    attrPh = $el.attr('placeholder');
                if (!id) {
                    id = this.id = createId(); //如果没有id,生成一个附带8位随机数的id
                }
                label = $('<label class="'+ labelCls + ($el.val()!==''?' '+hideCls:'')+'" for="'+ id +'" onselectstart="return false"><span>'+ attrPh +'</span></label>');
                phType && inputChange(this, changeStatus);
                $el.before(label);
            }

            label.find('span').css({
                //zIndex: $el.css('z-index') + 1,
                width: $el.css('width'),
                height: $el.css('height'),
                paddingTop: $el.css('padding-top'),
                paddingLeft: $el.css('padding-left'),
                marginLeft: (parseInt($el.css('margin-left')) + parseInt($el.css('border-left-width'))) + 'px',
                marginTop: (parseInt($el.css('margin-top')) + parseInt($el.css('border-top-width'))) + 'px',
                fontSize: $el.css('font-size'),
                fontFamily: $el.css('font-family'),
                lineHeight: $el.css('line-height')
            });
            if (css) label.find('span').css(css);
        });
    }
 
    function createId() {
        return 'ph'+ (Math.random().toString().substr(2,8));
    }

    function changeStatus(el, value){
        var $el = $(el), $label = $el.prevAll('label.'+ labelCls +'[for='+ el.id +']'), hasClass = $label.hasClass(hideCls);
        if (value === "" || $el.val() === '') {
            hasClass && $label.removeClass(hideCls);
        } else {
            !hasClass && $label.addClass(hideCls);
        }
    }
      
    /* IE6-8不支持reset事件冒泡
     * http://www.w3help.org/zh-cn/causes/SD9032
     * benalman.com/news/2010/03/jquery-special-events/
     */
    if (isIE && isIE <= 8 && !$.event.special.reset) { 
        $.event.special.reset = {
            setup: function() {
                if ( $.nodeName( this, "form" ) ) {return false;}
                $.event.add( this, "click._reset keypress._reset", function( e ) {
                    var elem = e.target,
                        form = $.nodeName( elem, "input" ) || $.nodeName( elem, "button" ) ? elem.form : undefined;
                    if ( form && !form._reset_attached ) {
                        $.event.add( form, "reset._reset", function( event ) {
                            event._reset_bubble = true;
                        });
                        form._reset_attached = true;
                    }
                });
            },
            postDispatch: function( event ) {
                if ( event._reset_bubble ) {
                    delete event._reset_bubble;
                    if ( this.parentNode && !event.isTrigger ) {
                        $.event.simulate( "reset", this.parentNode, event, true );
                    }
                }
            },
            teardown: function() {
                if ( $.nodeName( this, "form" ) ) {return false;}
                $.event.remove( this, "._reset" );
            }
        };
    }

    if (needCreate()) {
        var valHooks = $.valHooks;
        valHooks.input = valHooks.input || {};
        valHooks.textarea = valHooks.textarea || {};
        var oldSet = {
                input: valHooks.input.set,
                textarea: valHooks.textarea.set
            };
        valHooks.input['set'] = valHooks.textarea['set'] = function(elem, value) {
            var nodeName = elem.nodeName.toLowerCase();
            oldSet[nodeName] && oldSet[nodeName](elem, value);
            setTimeout(function(){
                changeStatus(elem, value);
            },0);
        };
    }

   
   /* 绑定到body的一些事件 */
    $(function(){
        var $body = $('body'), 
            phSelector = '[placeholder]',
            getPh = function(el){
                if (!el.id) el.id = createId();
                return $(el).prevAll('label.'+ labelCls +'[for="'+ el.id +'"]');
            };

        //实现placeholder兼容，（IE9的oninput事件有Bug，按退格键不触发,onpropertychange也是）
        if (!isPlaceholder || phType) {
            if (phType) {
                $body.on('focusin focusout', phSelector, function(e){
                    e.type == 'focusin' ? getPh(this).addClass(focusCls) : getPh(this).removeClass(focusCls);
                    changeStatus(this);
                });
                if ( isChrome || (isMoz && isMoz>15) || (isIE && isIE>9) ) $('html').addClass('ph-fix');
                isSafari && $body.addClass('ph-safari');
            } else {
                $body.on('focusin focusout', phSelector, function(e){
                    if (this.value === '') {
                        e.type === 'focusin' ? getPh(this).addClass(hideCls) : getPh(this).removeClass(hideCls);
                    }
                });
            }
            //表单重置处理
            $body.on('reset', 'form', function(e){
                setTimeout(function(){ //延迟到浏览器默认重置之后处理
                    $('input,textarea', e.target).filter(phSelector).each(function(i, el){
                        changeStatus(el);
                    });
                }, 25);
            }).on('contextmenu', '.'+labelCls, function(){ //防止右键菜单没有“粘贴”项
                $(this).next(phSelector).focus();
            }).on('input', phSelector, function(){
                changeStatus(this);
            });
        }

        if ( needCreate() ) createPh();
    });
    
    function needCreate(){
        return !isPlaceholder || ( phType && ( !isChrome && (isMoz && isMoz<15) || (isIE && isIE>9) || isSafari ) );
    }

    $.fn.placeholder = function(css){
        if ( needCreate() ) createPh(this, css);
        return this;
    };

})(jQuery);
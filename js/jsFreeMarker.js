// 模板引擎
;(function(){
    var tplStr='',tplData=null;
    var tagList=function(arr){
        var listName,loopName,loopIndexName,loopHasNextName,result=[];
        loopName=arr[3];
        listName=arr[1];
        loopIndexName=(arr[4])?(arr[4]):(loopName + '_index');
        loopHasNextName=(arr[5])?(arr[5]):(loopName + '_has_next');
        result.push('(function(){');
        if(!/^\w+$/.test(listName)){
            result.push('var _list=' + listName + ';');
            listName = '_list';
        }
        result.push(['var _i=0', '_count=' + listName + '.length',loopName,loopIndexName,loopHasNextName+';'].join(','));
        result.push('for(;_i<_count;_i++){');
        result.push(loopName + '=' + listName + '[_i];');
        result.push(loopIndexName + '=_i;');
        result.push(loopHasNextName + '=_i!==_count-1;');
        return result.join('');
    },
    tagEndList=function(arr){
        return '}})();';
    },
    tagIf=function(arr){
        if(arr.length<2){return false;}
        return 'if(' + arr.slice(1).join('') + '){'
    },
    tagElse=function(arr){
        return '}else{';
    },
    tagEndIf=function(arr){
        return '}';
    },
    tagElseIf=function(arr){
        if(arr.length<2){return false;}
        return '}else if(' + arr.slice(1).join('') + '){';
    },

    tagSwitch=function(arr){
        return 'switch(' + arr.join('').replace('switch','') + '){'
    },
    tagCase=function(arr){
        return ('case ' + arr[1] + ':');
    },
    tagBreak=function(){
        return 'break;'
    },
    tagDefault=function(){
        return 'default:'
    },
    tagEndSwitch=function(arr){
        return '}';
    };
    var tagObj={
        'list':tagList,
        'if':tagIf,
        'break':tagBreak,
        '/#list':tagEndList,
        'else':tagElse,
        '/#if':tagEndIf,
        'elseif':tagElseIf,
        'switch':tagSwitch,
        'case':tagCase,
        'default':tagDefault,
        '/#switch':tagEndSwitch
    };
    var rule=function(str){
        var listArr = util.removeEmpty(str.split(' '));
        return (tagObj[listArr[0]]).call(this, listArr);
    };
    
    var util={
        trim:function(str){
            return this.replace(/(^\s*)|(\s*$)/g, "");
        },
        lTrim:function(str){
            return this.replace(/(^\s*)/g, "");
        },
        rTrim:function(str){
            return this.replace(/(\s*$)/g, "");
        },
        removeEmpty:function(arr){
            return arr.join(',').replace(',,', ',').split(',');
        }
    };
    var parse=function(tpl){
        var chunks = [], idx = 0, lastIndex = 0, le = tpl.length;
        var self = this;
        var printPrefix = "__buf__.push(";
        var replaced = [];
        tpl=tpl.replace("\r\n",'').replace("\t",'');
        function pushStr(str){
            str = str.replace(/'/g, "\\'");
            if (str !== '') {
                replaced.push(printPrefix + '\'' + str + '\');');
            }
        }
        var peek = function(tok){
                if (tok == "<") {
                    if (tpl[idx + 1] == "#" && tpl[idx + 2] == "-" && tpl[idx + 2] == "-") {
                        findEnd(">");
                        chunks.push(tpl.substring(lastIndex, idx));
                        pushStr(chunks[chunks.length-1].replace("#",'!'));
                        return true;
                    }else if (tpl[idx + 1] == "#") {
                            findEnd(">");
                            chunks.push(tpl.substring(lastIndex, idx));
                            replaced.push(rule(chunks[chunks.length-1].slice(2, -1)));
                            return true;
                    }else if (tpl[idx + 1] == "/" && tpl[idx + 2] == "#") {
                                findEnd(">");
                                chunks.push(tpl.substring(lastIndex, idx));
                                replaced.push(rule(chunks[chunks.length-1].slice(1, -1)))
                                return true;
                    }else{
                        var findTag=function(str){
                            for (var i = idx+2 ; i < le; i++) {
                                    if (tpl[i] == str) {
                                        return i;
                                    }
                            }
                        };
                        var ss=findTag('$');
                        var tt=findTag('>');
                        if(ss<tt){
                            
                            chunks.push(tpl.substring(lastIndex, ss));

                            pushStr(chunks[chunks.length-1]);

                            findEnd("$");
                            findEnd("}");
                            chunks.push(tpl.substring(lastIndex-1, idx));
                            replaced.push(printPrefix + chunks[chunks.length-1].slice(2, -1) + ');');
                            //findEnd(">");
                        }else{
                            findEnd(">");
                            chunks.push(tpl.substring(lastIndex, idx));
                            pushStr(chunks[chunks.length-1].replace("#",'!'));
                        }
                        

                        return true;
                    }
                }
                else if(tok=="$") {
                    if (tpl[idx + 1] == "{") {
                        findEnd("}");
                        chunks.push(tpl.substring(lastIndex, idx));
                        replaced.push(printPrefix + chunks[chunks.length-1].slice(2, -1) + ');');
                        return true;
                    }
                }else{
                    
            return false;
                    
                }

        }
        var findEnd = function(tok){
            for (var i = idx+2 ; i < le; i++) {
                    if (tpl[i] == tok) {
                        //增加非语法句
                        if (tpl[lastIndex] != '<'&&(tok=='}'||tok=='>')) {
                            chunks.push(tpl.substring(lastIndex, idx))
                            pushStr(chunks[chunks.length-1]);
                        }
                        lastIndex = idx;
                        idx = i + 1;
                        break;
                    }
            }
        }
        
        while (idx < le) {
            if (peek(tpl[idx])) {
                //增加语法句
                lastIndex = idx;
            }
            else {
                idx++;
            }
        }
        
        chunks.push(tpl.substring(lastIndex));
        replaced.push(tpl.substring(lastIndex));
        replaced = ["var __buf__=[],$index=null;with(data){", replaced.join(''), "} return __buf__.join('');"].join('');
        
        return (new Function("data",replaced)).call(window,tplData);
    };
    window.jsFreeMarker=function(tpl,data){
        if(Object.prototype.toString.call(tpl) == '[object Array]'){
            tplStr=tpl.join('');
        }else{
            tplStr=tpl;
        }
        tplData=data;
        return parse(tplStr);
    };
    
})();
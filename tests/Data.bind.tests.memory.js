/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function (global, undefined) {
    "use strict";

    module("jsMVC.dataBinding");

    var noop = function () {
    },
        delay = function (callback) {
            return $.Deferred(function (deferred, time) {
                time = time || 110;
                global.setTimeout(function () {
                    callback();
                    deferred.resolve();
                }, time);
            }).promise();
        },
        getBigString = function () {
            var array = new Array(50001);
            return array.join("-");
        },
        getDelay = function (callback) {
            return delay(callback);
        },
        cleanUpHash = function () {
            global.location.hash = "";
        };

    var jsMVC = global.jsMVC;

    test("Can bind one elements with multiple data and can unbind.", function () {
        //return;
        var bindAndUndind = function (data) {
            jsMVC.dataBind(root1, data);
            //            equal($root1.css("marginLeft"), "2px");
            //            equal($root1.prop("action"), "http://jsmvc.net/");
            //            equal($root1.find("span").text(), "Name");
            //            equal($root1.find("span")[0].innerHTML, "Name");
            //            equal($root1.find("input[type='text']").val(), 123);
            //            equal($root1.find("input[type='button']").val(), "Submit Name");

            jsMVC.dataBind(root2, data);
            //            equal($root2.eq(0).css("marginLeft"), "2px");
            //            equal($root2.eq(0).text(), "Name");
            //            equal($root2.eq(0).html(), "Name");
            //            equal($root2.eq(1).css("marginLeft"), "2px");
            //            equal($root2.eq(1).text(), "Submit Name");
            //            equal($root2.eq(1).html(), "Submit Name");

            data.set("label", 888);
            //            equal(data.get("label"), 888);
            //            equal($root1.find("span").text(), 888);
            //            equal($root1.find("span")[0].innerHTML, 888);
            //            equal($root1.find("input[type='button']").val(), "Submit 888");
            //            equal($root2.eq(0).text(), 888);
            //            equal($root2.eq(0).html(), 888);
            //            equal($root2.eq(1).text(), "Submit 888");
            //            equal($root2.eq(1).html(), "Submit 888");

            jsMVC.dataUnbind(root1);
            data.set("label", 999);
            //            equal(data.get("label"), 999);
            //            equal(data.get("button"), "Submit 999");
            //            equal($root1.find("span").text(), 888);
            //            equal($root1.find("span")[0].innerHTML, 888);
            //            equal($root1.find("input[type='button']").val(), "Submit 888");
            //            equal($root2.eq(0).text(), 999);
            //            equal($root2.eq(0).html(), 999);
            //            equal($root2.eq(1).text(), "Submit 999");
            //            equal($root2.eq(1).html(), "Submit 999");

            jsMVC.dataUnbind(root2);
            data.set("label", 555);
            //            equal(data.get("label"), 555);
            //            equal(data.get("button"), "Submit 555");
            //            equal($root1.find("span").text(), 888);
            //            equal($root1.find("span")[0].innerHTML, 888);
            //            equal($root1.find("input[type='button']").val(), "Submit 888");
            //            equal($root2.eq(0).text(), 999);
            //            equal($root2.eq(0).html(), 999);
            //            equal($root2.eq(1).text(), "Submit 999");
            //            equal($root2.eq(1).html(), "Submit 999");
        };
        var $root1 = $('<form data-bind="style.marginLeft: marginLeft; action: action"><div><span data-bind="textContent: label"></span><input type="text" data-bind="value: value" /></div><div><input type="button" data-bind="value: button" /></div></form>');
        var root1 = $root1[0];
        var $root2 = $('<p data-bind="style.marginLeft: marginLeft; textContent: label"></p><span data-bind="style.marginLeft: marginLeft; textContent: button"></span>');
        var root2 = $root2[0].parentNode.childNodes;
        for (var i = 0; i < 5000; i++) {
            bindAndUndind(jsMVC.Observable({
                marginLeft: "2px",
                action: "http://jsmvc.net/",
                label: "Name",
                value: 123,
                bigString: getBigString()
            }).add("button", function (label) {
                return "Submit " + label;
            }, ["label"]));
        }
    });

})(this);
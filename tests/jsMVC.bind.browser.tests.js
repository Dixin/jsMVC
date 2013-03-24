/// <reference path="../tools/_references.js"/>
/// <reference path="../source/_references.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    if (!browser) {
        // Not in browser.
        return;
    }

    QUnit.module("jsMVC.bind.browser");

    var noop = function() {
    },
        delay = function(callback) {
            return $.Deferred(function(deferred, time) {
                time = time || 110;
                browser.setTimeout(function() {
                    callback();
                    deferred.resolve();
                }, time);
            }).promise();
        },
        getDelay = function(callback) {
            return delay(callback);
        },
        cleanUpHash = function() {
            browser.location.hash = "";
        },
        // http://darktalker.com/2010/manually-trigger-dom-event/
        fireEvent = function(element, event) {
            var evt;
            var isString = function(it) {
                return typeof it == "string" || it instanceof String;
            };
            element = (isString(element)) ? document.getElementById(element) : element;
            if (document.createEventObject) {
                // dispatch for IE
                evt = document.createEventObject();
                return element.fireEvent('on' + event, evt);
            } else {
                // dispatch for firefox + others
                evt = document.createEvent("HTMLEvents");
                evt.initEvent(event, true, true); // event type,bubbling,cancelable
                return !element.dispatchEvent(evt);
            }
        };

    var Observable = jsMVC.Observable,
        dataBind = jsMVC.bind,
        dataUnbind = jsMVC.unbind;

    test("Can bind element with observable object and can unbind", function() {
        var $root = $('<div data-bind="textContent:fullName; style.marginLeft: marginLeft; click: click"></div>');
        var root = $root[0];
        var isClicked1 = false;
        var data = Observable({
            firstName: "A",
            lastName: "B",
            marginLeft: "2px",
            click: function() {
                isClicked1 = true;
            }
        }).add("fullName", function(firstName, lastName) {
            return firstName + " " + lastName;
        }, ["firstName", "lastName"]);
        dataBind(root, data);
        equal($root.text(), "A B");
        equal(root.innerHTML, "A B");
        equal(root.style.marginLeft, "2px");
        root.click();
        equal(isClicked1, true);

        data.set("firstName", "X");
        equal(data.get("fullName"), "X B");
        equal($root.text(), "X B");
        equal(root.innerHTML, "X B");
        equal(root.style.marginLeft, "2px");
        isClicked1 = false;
        var isClicked2 = false;
        data.set("click", function() {
            isClicked2 = true;
        });
        root.click();
        equal(isClicked1, false);
        equal(isClicked2, true);

        data.set("marginLeft", "10%");
        equal($root.text(), "X B");
        equal(root.innerHTML, "X B");
        equal(root.style.marginLeft, "10%");

        dataUnbind(root);
        data.set("marginLeft", "20%");
        data.set("firstName", "Y");
        equal(data.get("fullName"), "Y B");
        equal($root.text(), "X B");
        equal(root.innerHTML, "X B");
        equal(root.style.marginLeft, "10%");
        isClicked2 = false;
        data.set("click", function() {
            isClicked1 = true;
            isClicked2 = true;
        });
        root.click();
        equal(isClicked1, false);
        equal(isClicked2, false);

        data.set("marginLeft", "30%");
        data.set("firstName", "Z");
        equal(data.get("fullName"), "Z B");
        equal($root.text(), "X B");
        equal(root.innerHTML, "X B");
        equal(root.style.marginLeft, "10%");
    });

    test("Can bind element with object", function() {
        var $root = $('<div data-bind="textContent:fullName; style.marginLeft: marginLeft; click: click"></div>');
        var root = $root[0];
        var isClicked1 = false;
        var data = {
            fullName: "A B",
            marginLeft: "5px",
            click: function() {
                isClicked1 = true;
            }
        };

        dataBind(root, data);
        equal($root.text(), "A B");
        equal(root.innerHTML, "A B");
        equal(root.style.marginLeft, "5px");
        root.click();
        equal(isClicked1, true);

        data.fullName = "C D";
        isClicked1 = false;
        var isClicked2 = false;
        data.click = function() {
            isClicked2 = true;
        };
        equal($root.text(), "A B");
        equal(root.innerHTML, "A B");
        equal(root.style.marginLeft, "5px");
        root.click();
        equal(isClicked1, true);
        equal(isClicked2, false);

        data.marginLeft = "10px";
        equal($root.text(), "A B");
        equal(root.innerHTML, "A B");
        equal(root.style.marginLeft, "5px");

        dataUnbind(root);
        equal($root.text(), "A B");
        equal(root.innerHTML, "A B");
        equal(root.style.marginLeft, "5px");

        data.fullName = "E F";
        data.marginLeft = "20px";
        equal($root.text(), "A B");
        equal(root.innerHTML, "A B");
        equal(root.style.marginLeft, "5px");
    });

    test("Can bind element and children with observable and can unbind", function() {
        var $root = $('<form data-bind="style.marginLeft: marginLeft; action: action"><div><span data-bind="textContent: label"></span><input type="text" data-bind="value: value" /></div><div><input type="button" data-bind="value: button; click: click" /></div></form>');
        var root = $root[0];
        var isClicked1 = false;
        var data = Observable({
            marginLeft: "2px",
            action: "http://jsmvc.net/",
            label: "Name",
            value: 123,
            click: function() {
                isClicked1 = true;
            }
        }).add("button", function(label) {
            return "Submit " + label;
        }, ["label"]);
        dataBind(root, data);
        equal($root.css("marginLeft"), "2px");
        equal($root.prop("action"), "http://jsmvc.net/");
        equal($root.find("span").text(), "Name");
        equal($root.find("span")[0].innerHTML, "Name");
        equal($root.find("input[type='text']").val(), 123);
        equal($root.find("input[type='button']").val(), "Submit Name");
        $root.find("input[type='button']")[0].click();
        equal(isClicked1, true);

        data.set("label", 888);
        equal(data.get("label"), 888);
        equal($root.find("span").text(), 888);
        equal($root.find("span")[0].innerHTML, 888);
        equal($root.find("input[type='button']").val(), "Submit 888");
        isClicked1 = false;
        var isClicked2 = false;
        data.set("click", function() {
            isClicked2 = true;
        });
        $root.find("input[type='button']")[0].click();
        equal(isClicked1, false);
        equal(isClicked2, true);

        dataUnbind(root);
        data.set("label", 999);
        equal(data.get("label"), 999);
        equal(data.get("button"), "Submit 999");
        equal($root.find("span").text(), 888);
        equal($root.find("span")[0].innerHTML, 888);
        equal($root.find("input[type='button']").val(), "Submit 888");
        isClicked2 = false;
        data.set("click", function() {
            isClicked1 = true;
            isClicked2 = true;
        });
        $root.find("input[type='button']")[0].click();
        equal(isClicked1, false);
        equal(isClicked2, false);
    });

    test("Can bind multiple elements and children with observable and can unbind", function() {
        var $root1 = $('<form data-bind="style.marginLeft: marginLeft; action: action"><div><span data-bind="textContent: label"></span><input type="text" data-bind="value: value" /></div><div><input type="button" data-bind="value: button" /></div></form>');
        var root1 = $root1[0];
        var $root2 = $('<p data-bind="style.marginLeft: marginLeft; textContent: label"></p><span data-bind="style.marginLeft: marginLeft; textContent: button"></span>');
        var root2 = $root2[0].parentNode.childNodes;
        var data = Observable({
            marginLeft: "2px",
            action: "http://jsmvc.net/",
            label: "Name",
            value: 123
        }).add("button", function(label) {
            return "Submit " + label;
        }, ["label"]);
        dataBind(root1, data);
        equal($root1.css("marginLeft"), "2px");
        equal($root1.prop("action"), "http://jsmvc.net/");
        equal($root1.find("span").text(), "Name");
        equal($root1.find("span")[0].innerHTML, "Name");
        equal($root1.find("input[type='text']").val(), 123);
        equal($root1.find("input[type='button']").val(), "Submit Name");

        dataBind(root2, data);
        equal($root2.eq(0).css("marginLeft"), "2px");
        equal($root2.eq(0).text(), "Name");
        equal($root2.eq(0).html(), "Name");
        equal($root2.eq(1).css("marginLeft"), "2px");
        equal($root2.eq(1).text(), "Submit Name");
        equal($root2.eq(1).html(), "Submit Name");

        data.set("label", 888);
        equal(data.get("label"), 888);
        equal($root1.find("span").text(), 888);
        equal($root1.find("span")[0].innerHTML, 888);
        equal($root1.find("input[type='button']").val(), "Submit 888");
        equal($root2.eq(0).text(), 888);
        equal($root2.eq(0).html(), 888);
        equal($root2.eq(1).text(), "Submit 888");
        equal($root2.eq(1).html(), "Submit 888");

        dataUnbind(root1);
        data.set("label", 999);
        equal(data.get("label"), 999);
        equal(data.get("button"), "Submit 999");
        equal($root1.find("span").text(), 888);
        equal($root1.find("span")[0].innerHTML, 888);
        equal($root1.find("input[type='button']").val(), "Submit 888");
        equal($root2.eq(0).text(), 999);
        equal($root2.eq(0).html(), 999);
        equal($root2.eq(1).text(), "Submit 999");
        equal($root2.eq(1).html(), "Submit 999");

        dataUnbind(root2);
        data.set("label", 555);
        equal(data.get("label"), 555);
        equal(data.get("button"), "Submit 555");
        equal($root1.find("span").text(), 888);
        equal($root1.find("span")[0].innerHTML, 888);
        equal($root1.find("input[type='button']").val(), "Submit 888");
        equal($root2.eq(0).text(), 999);
        equal($root2.eq(0).html(), 999);
        equal($root2.eq(1).text(), "Submit 999");
        equal($root2.eq(1).html(), "Submit 999");
    });

    test("Can bind multiple elements and children with object and can unbind", function() {
        var $root1 = $('<form data-bind="style.marginLeft: marginLeft; action: action"><div><span data-bind="textContent: label"></span><input type="text" data-bind="value: value" /></div><div><input type="button" data-bind="value: button" /></div></form>');
        var root1 = $root1[0];
        var $root2 = $('<p data-bind="style.marginLeft: marginLeft; textContent: label"></p><span data-bind="style.marginLeft: marginLeft; textContent: button"></span>');
        var root2 = $root2[0].parentNode.childNodes;
        var data = {
            marginLeft: "2px",
            action: "http://jsmvc.net/",
            label: "Name",
            value: 123,
            button: "Submit Name"
        };
        dataBind(root1, data);
        equal($root1.css("marginLeft"), "2px");
        equal($root1.prop("action"), "http://jsmvc.net/");
        equal($root1.find("span").text(), "Name");
        equal($root1.find("span")[0].innerHTML, "Name");
        equal($root1.find("input[type='text']").val(), 123);
        equal($root1.find("input[type='button']").val(), "Submit Name");

        dataBind(root2, data);
        equal($root2.eq(0).css("marginLeft"), "2px");
        equal($root2.eq(0).text(), "Name");
        equal($root2.eq(0).html(), "Name");
        equal($root2.eq(1).css("marginLeft"), "2px");
        equal($root2.eq(1).text(), "Submit Name");
        equal($root2.eq(1).html(), "Submit Name");

        data.label = 888;
        equal(data.label, 888);
        equal($root1.find("span").text(), "Name");
        equal($root1.find("span")[0].innerHTML, "Name");
        equal($root1.find("input[type='button']").val(), "Submit Name");
        equal($root2.eq(0).text(), "Name");
        equal($root2.eq(0).html(), "Name");
        equal($root2.eq(1).text(), "Submit Name");
        equal($root2.eq(1).html(), "Submit Name");

        dataUnbind(root1);
        data.label = 999;
        equal(data.label, 999);
        equal($root1.find("span").text(), "Name");
        equal($root1.find("span")[0].innerHTML, "Name");
        equal($root1.find("input[type='button']").val(), "Submit Name");
        equal($root2.eq(0).text(), "Name");
        equal($root2.eq(0).html(), "Name");
        equal($root2.eq(1).text(), "Submit Name");
        equal($root2.eq(1).html(), "Submit Name");

        dataUnbind(root2);
        data.label = 555;
        equal(data.label, 555);
        equal($root1.find("span").text(), "Name");
        equal($root1.find("span")[0].innerHTML, "Name");
        equal($root1.find("input[type='button']").val(), "Submit Name");
        equal($root2.eq(0).text(), "Name");
        equal($root2.eq(0).html(), "Name");
        equal($root2.eq(1).text(), "Submit Name");
        equal($root2.eq(1).html(), "Submit Name");
    });

    test("Can bind element and children with observable hierarchy and can unbind", function() {
        var $root = $('<div data-bind="style.marginLeft: marginLeft"> <div data-bind="textContent: person1.name"></div> <!--xx--><div data-bind="textContent: person2.name"></div></div>');
        var root = $root[0];
        var data = Observable({
            marginLeft: "2px",
            person1: Observable({
                name: "p1"
            }),
            person2: Observable({
                name: "p2"
            })
        });
        dataBind(root, data);
        equal($root.css("marginLeft"), "2px");
        equal($root.find("div").eq(0).html(), "p1");
        equal($root.find("div").eq(1).html(), "p2");
        equal($root.find("div").eq(0).text(), "p1");
        equal($root.find("div").eq(1).text(), "p2");

        data.set("marginLeft", "3px");
        equal($root.css("marginLeft"), "3px");

        data.get("person1").set("name", "p3");
        data.get("person2").set("name", "p4");
        equal($root.find("div").eq(0).html(), "p3");
        equal($root.find("div").eq(1).html(), "p4");
        equal($root.find("div").eq(0).text(), "p3");
        equal($root.find("div").eq(1).text(), "p4");

        var old1 = data.get("person1");
        var old2 = data.get("person2");

        data.set("person1", Observable({
            name: "pp1"
        }));
        data.set("person2", Observable({
            name: "pp2"
        }));
        equal($root.find("div").eq(0).html(), "pp1");
        equal($root.find("div").eq(1).html(), "pp2");
        equal($root.find("div").eq(0).text(), "pp1");
        equal($root.find("div").eq(1).text(), "pp2");

        old1.set("name", "old1");
        old2.set("name", "old2");
        equal($root.find("div").eq(0).html(), "pp1");
        equal($root.find("div").eq(1).html(), "pp2");
        equal($root.find("div").eq(0).text(), "pp1");
        equal($root.find("div").eq(1).text(), "pp2");

        data.get("person1").set("name", "pp3");
        data.get("person2").set("name", "pp4");
        equal($root.find("div").eq(0).html(), "pp3");
        equal($root.find("div").eq(1).html(), "pp4");
        equal($root.find("div").eq(0).text(), "pp3");
        equal($root.find("div").eq(1).text(), "pp4");

        dataUnbind(root);
        data.set("marginLeft", "4px");
        equal($root.css("marginLeft"), "3px");

        data.get("person1").set("name", "p5");
        data.get("person2").set("name", "p6");
        equal($root.find("div").eq(0).html(), "pp3");
        equal($root.find("div").eq(1).html(), "pp4");
        equal($root.find("div").eq(0).text(), "pp3");
        equal($root.find("div").eq(1).text(), "pp4");

        data.set("person1", Observable({
            name: "pp5"
        }));
        data.set("person2", Observable({
            name: "pp6"
        }));
        equal($root.find("div").eq(0).html(), "pp3");
        equal($root.find("div").eq(1).html(), "pp4");
        equal($root.find("div").eq(0).text(), "pp3");
        equal($root.find("div").eq(1).text(), "pp4");
    });

    test("Can bind element and children with observable hierarchy and can remove and add binding", function() {
        var $root = $('<div data-bind="style.marginLeft: marginLeft"> <div data-bind="textContent: person1.name"></div> <!--xx--><div data-bind="textContent: person2.name"></div></div>');
        var root = $root[0];
        var data = Observable({
            marginLeft: "2px",
            person1: Observable({
                name: "p1"
            }),
            person2: Observable({
                name: "p2"
            })
        });
        dataBind(root, data);
        equal($root.css("marginLeft"), "2px");
        equal($root.find("div").eq(0).html(), "p1");
        equal($root.find("div").eq(1).html(), "p2");
        equal($root.find("div").eq(0).text(), "p1");
        equal($root.find("div").eq(1).text(), "p2");

        data.set("marginLeft", "3px");
        equal($root.css("marginLeft"), "3px");

        data.get("person1").set("name", "p3");
        data.get("person2").set("name", "p4");
        equal($root.find("div").eq(0).html(), "p3");
        equal($root.find("div").eq(1).html(), "p4");
        equal($root.find("div").eq(0).text(), "p3");
        equal($root.find("div").eq(1).text(), "p4");

        var old1 = data.get("person1");
        var old2 = data.get("person2");

        data.remove("person1");
        data.remove("person2");

        old1.set("name", "old1");
        old2.set("name", "old2");
        equal($root.find("div").eq(0).html(), "p3");
        equal($root.find("div").eq(1).html(), "p4");
        equal($root.find("div").eq(0).text(), "p3");
        equal($root.find("div").eq(1).text(), "p4");

        data.add("person1", Observable({
            name: "pp3"
        }));
        data.add("person2", Observable({
            name: "pp4"
        }));
        equal($root.find("div").eq(0).html(), "pp3");
        equal($root.find("div").eq(1).html(), "pp4");
        equal($root.find("div").eq(0).text(), "pp3");
        equal($root.find("div").eq(1).text(), "pp4");

        data.get("person1").set("name", "pp5");
        data.get("person2").set("name", "pp6");
        equal($root.find("div").eq(0).html(), "pp5");
        equal($root.find("div").eq(1).html(), "pp6");
        equal($root.find("div").eq(0).text(), "pp5");
        equal($root.find("div").eq(1).text(), "pp6");

        dataUnbind(root);
        data.set("marginLeft", "4px");
        equal($root.css("marginLeft"), "3px");

        data.get("person1").set("name", "p5");
        data.get("person2").set("name", "p6");
        equal($root.find("div").eq(0).html(), "pp5");
        equal($root.find("div").eq(1).html(), "pp6");
        equal($root.find("div").eq(0).text(), "pp5");
        equal($root.find("div").eq(1).text(), "pp6");

        data.set("person1", Observable({
            name: "pp5"
        }));
        data.set("person2", Observable({
            name: "pp6"
        }));
        equal($root.find("div").eq(0).html(), "pp5");
        equal($root.find("div").eq(1).html(), "pp6");
        equal($root.find("div").eq(0).text(), "pp5");
        equal($root.find("div").eq(1).text(), "pp6");
    });

    test("Can bind element and each children with observable array and can unbind", function() {
        var $root = $('<ul data-bind="style.marginLeft: marginLeft" data-each="persons"><li data-bind="style.display: display; textContent: name"></li></ul>');
        var root = $root[0];
        var data = Observable({
            marginLeft: "10px",
            persons: Observable([
                Observable({
                    display: "block",
                    name: "p1"
                }),
                Observable({
                    display: "none",
                    name: "p2"
                })
            ])
        });

        dataBind(root, data);
        equal($root.css("marginLeft"), "10px");
        equal($root.children().length, 2);
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(0).html(), "p1");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(0).css("display"), "block");
        equal($root.children().eq(1).css("display"), "none");

        data.get("persons").get(0).set("name", "pp1");
        equal($root.children().eq(0).text(), "pp1");
        equal($root.children().eq(0).html(), "pp1");

        var old1 = data.get("persons").get(1);
        data.get("persons").set(1, Observable({
            display: "inline",
            name: "ppp2"
        }));
        equal($root.children().eq(1).text(), "ppp2");
        equal($root.children().eq(1).html(), "ppp2");
        equal($root.children().eq(1).css("display"), "inline");

        old1.set("name", "old2");
        old1.set("display", "none");
        equal($root.children().eq(1).text(), "ppp2");
        equal($root.children().eq(1).html(), "ppp2");
        equal($root.children().eq(1).css("display"), "inline");

        data.get("persons").push(Observable({
            display: "inline-block",
            name: "p3"
        }));
        equal($root.children().length, 3);
        equal($root.children().eq(2).text(), "p3");
        equal($root.children().eq(2).html(), "p3");
        equal($root.children().eq(2).css("display"), "inline-block");

        data.get("persons").removeAt(2);
        equal($root.children().length, 2);

        data.get("persons").addAt(1, Observable({
            display: "inline-block",
            name: "p4"
        }));
        equal($root.children().length, 3);
        equal($root.children().eq(1).text(), "p4");
        equal($root.children().eq(1).html(), "p4");
        equal($root.children().eq(1).css("display"), "inline-block");
        equal($root.children().eq(2).text(), "ppp2");
        equal($root.children().eq(2).html(), "ppp2");
        equal($root.children().eq(2).css("display"), "inline");

        data.get("persons").removeAt(0);
        equal($root.children().length, 2);

        dataUnbind(root);
        data.get("persons").get(0).set("name", "ppp1");
        equal($root.children().eq(0).text(), "p4");
        equal($root.children().eq(0).html(), "p4");

        data.get("persons").set(1, Observable({
            display: "none",
            name: "pppp2"
        }));
        equal($root.children().eq(0).text(), "p4");
        equal($root.children().eq(0).html(), "p4");
        equal($root.children().eq(0).css("display"), "inline-block");
        equal($root.children().eq(1).text(), "ppp2");
        equal($root.children().eq(1).html(), "ppp2");
        equal($root.children().eq(1).css("display"), "inline");
    });

    test("Can bind element and each children with array and can unbind", function() {
        var $root = $('<ul data-bind="style.marginLeft: marginLeft" data-each="persons"><li data-bind="style.display: display; textContent: name"></li></ul>');
        var root = $root[0];
        var data = {
            marginLeft: "10px",
            persons: [{
                display: "block",
                name: "p1"
            }, {
                display: "none",
                name: "p2"
            }]
        };

        dataBind(root, data);
        equal($root.css("marginLeft"), "10px");
        equal($root.children().length, 2);
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(0).html(), "p1");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(0).css("display"), "block");
        equal($root.children().eq(1).css("display"), "none");

        data["persons"][0]["name"] = "pp1";
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(0).html(), "p1");

        var old1 = data["persons"][1];
        data["persons"][1] = {
            display: "inline",
            name: "ppp2"
        };
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(1).css("display"), "none");

        old1["name"] = "old2";
        old1["display"] = "none";
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(1).css("display"), "none");

        data["persons"].push({
            display: "inline",
            name: "p3"
        });
        equal($root.children().length, 2);

        data["persons"].splice(0, 1);
        equal($root.children().length, 2);
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(0).html(), "p1");
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");

        dataUnbind(root);
        data["persons"][0]["name"] = "ppp1";
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(0).html(), "p1");
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");

        data["persons"][1] = Observable({
            display: "none",
            name: "pppp2"
        });
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(0).html(), "p1");
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(1).css("display"), "none");
    });

    test("Can bind element and children with observable array index and can unbind", function() {
        var $root = $('<ul data-bind="style.marginLeft: marginLeft"><li data-bind="style.display: persons[0].display; textContent: persons[0].name"></li><li data-bind="style.display: persons[1].display; textContent: persons[1].name"></li></ul>');
        var root = $root[0];
        var data = Observable({
            marginLeft: "10px",
            persons: Observable([
                Observable({
                    display: "block",
                    name: "p1"
                }),
                Observable({
                    display: "none",
                    name: "p2"
                })
            ])
        });

        dataBind(root, data);
        equal($root.css("marginLeft"), "10px");
        equal($root.children().length, 2);
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(0).html(), "p1");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(0).css("display"), "block");
        equal($root.children().eq(1).css("display"), "none");

        data.get("persons").get(0).set("name", "pp1");
        equal($root.children().eq(0).text(), "pp1");
        equal($root.children().eq(0).html(), "pp1");

        var old1 = data.get("persons").get(1);
        data.get("persons").set(1, Observable({
            display: "inline",
            name: "ppp2"
        }));
        equal($root.children().eq(1).text(), "ppp2");
        equal($root.children().eq(1).html(), "ppp2");
        equal($root.children().eq(1).css("display"), "inline");

        old1.set("name", "old2");
        old1.set("display", "none");
        equal($root.children().eq(1).text(), "ppp2");
        equal($root.children().eq(1).html(), "ppp2");
        equal($root.children().eq(1).css("display"), "inline");

        dataUnbind(root);
        data.get("persons").get(0).set("name", "ppp1");
        equal($root.children().eq(0).text(), "pp1");
        equal($root.children().eq(0).html(), "pp1");

        data.get("persons").set(1, Observable({
            display: "none",
            name: "pppp2"
        }));
        equal($root.children().eq(1).text(), "ppp2");
        equal($root.children().eq(1).html(), "ppp2");
        equal($root.children().eq(1).css("display"), "inline");
    });

    test("Can bind element and children with array index and can unbind", function() {
        var $root = $('<ul data-bind="style.marginLeft: marginLeft"><li data-bind="style.display: persons[0].display; textContent: persons[0].name"></li><li data-bind="style.display: persons[1].display; textContent: persons[1].name"></li></ul>');
        var root = $root[0];
        var data = {
            marginLeft: "10px",
            persons: [{
                display: "block",
                name: "p1"
            }, {
                display: "none",
                name: "p2"
            }]
        };

        dataBind(root, data);
        equal($root.css("marginLeft"), "10px");
        equal($root.children().length, 2);
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(0).html(), "p1");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(0).css("display"), "block");
        equal($root.children().eq(1).css("display"), "none");

        data["persons"][0]["name"] = "pp1";
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(0).html(), "p1");

        var old1 = data["persons"][1];
        data["persons"][1] = {
            display: "inline",
            name: "ppp2"
        };
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(1).css("display"), "none");

        old1["name"] = "old2";
        old1["display"] = "none";
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(1).css("display"), "none");

        dataUnbind(root);
        data["persons"][0]["name"] = "ppp1";
        equal($root.children().eq(0).text(), "p1");
        equal($root.children().eq(0).html(), "p1");

        data["persons"][1] = {
            display: "block",
            name: "pppp2"
        };
        equal($root.children().eq(1).text(), "p2");
        equal($root.children().eq(1).html(), "p2");
        equal($root.children().eq(1).css("display"), "none");
    });

    test("Can nest each binding and can unbind", function() {
        var $root = $('<ul data-bind="style.marginLeft: marginLeft" data-each="groups"><li><div data-bind="textContent: name"></div><ul data-each="persons"><li><p data-bind="textContent: name"></p><span data-bind="textContent: age"></span></li></ul></li></ul>');
        var root = $root[0];
        var data = Observable({
            marginLeft: "10px",
            groups: Observable([
                Observable({
                    name: "g0",
                    persons: Observable([
                        Observable({
                            name: "g0p0",
                            age: 0
                        }),
                        Observable({
                            name: "g0p1",
                            age: 1
                        })
                    ])
                }), Observable({
                    name: "g1",
                    persons: Observable([
                        Observable({
                            name: "g1p0",
                            age: 2
                        }),
                        Observable({
                            name: "g1p1",
                            age: 3
                        }),
                        Observable({
                            name: "g1p2",
                            age: 4
                        })
                    ])
                })])
        });

        dataBind(root, data);

        equal($root.children("li").length, 2);
        equal($root.children().eq(0).children().length, 2);
        equal($root.children().eq(0).children().eq(0).html(), "g0");
        equal($root.children().eq(0).children().eq(0).text(), "g0");
        equal($root.children("li").eq(0).children("ul").children("li").length, 2);
        equal($root.children().eq(0).children().eq(1).children().eq(0).find("p").html(), "g0p0");
        equal($root.children().eq(0).children().eq(1).children().eq(0).find("span").html(), 0);
        equal($root.children().eq(0).children().eq(1).children().eq(0).find("span").text(), 0);
        equal($root.children().eq(0).children().eq(1).children().eq(1).find("p").html(), "g0p1");
        equal($root.children().eq(0).children().eq(1).children().eq(1).find("span").html(), 1);
        equal($root.children().eq(0).children().eq(1).children().eq(1).find("span").text(), 1);
        equal($root.children().eq(1).children().length, 2);
        equal($root.children().eq(1).children().eq(0).html(), "g1");
        equal($root.children().eq(1).children().eq(0).text(), "g1");
        equal($root.children("li").eq(1).children("ul").children("li").length, 3);
        equal($root.children().eq(1).children().eq(1).children().eq(0).find("p").html(), "g1p0");
        equal($root.children().eq(1).children().eq(1).children().eq(0).find("span").html(), 2);
        equal($root.children().eq(1).children().eq(1).children().eq(0).find("span").text(), 2);
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("p").html(), "g1p1");
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("span").html(), 3);
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("span").text(), 3);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("p").html(), "g1p2");
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").html(), 4);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").text(), 4);

        data.get("groups").get(1).get("persons").addAt(2, Observable({
            name: "g1p3",
            age: 5
        }));
        equal($root.children().eq(1).children().eq(1).children().length, 4);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("p").html(), "g1p3");
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").html(), 5);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").text(), 5);
        equal($root.children().eq(1).children().eq(1).children().eq(3).find("p").html(), "g1p2");
        equal($root.children().eq(1).children().eq(1).children().eq(3).find("span").html(), 4);
        equal($root.children().eq(1).children().eq(1).children().eq(3).find("span").text(), 4);

        data.get("groups").get(1).get("persons").removeAt(1);
        equal($root.children().eq(1).children().eq(1).children().length, 3);
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("p").html(), "g1p3");
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("span").html(), 5);
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("span").text(), 5);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("p").html(), "g1p2");
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").html(), 4);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").text(), 4);

        data.get("groups").get(1).get("persons").push(Observable({
            name: "g1p4",
            age: 6
        }));
        equal($root.children().eq(1).children().eq(1).children().length, 4);
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("p").html(), "g1p3");
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("span").html(), 5);
        equal($root.children().eq(1).children().eq(1).children().eq(1).find("span").text(), 5);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("p").html(), "g1p2");
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").html(), 4);
        equal($root.children().eq(1).children().eq(1).children().eq(2).find("span").text(), 4);
        equal($root.children().eq(1).children().eq(1).children().eq(3).find("p").html(), "g1p4");
        equal($root.children().eq(1).children().eq(1).children().eq(3).find("span").html(), 6);
        equal($root.children().eq(1).children().eq(1).children().eq(3).find("span").text(), 6);

        data.get("groups").pop();
        equal($root.children().length, 1);
        equal($root.children().eq(0).children().length, 2);
        equal($root.children().eq(0).children().eq(0).html(), "g0");
        equal($root.children().eq(0).children().eq(0).text(), "g0");
        equal($root.children().eq(0).children().eq(1).children().length, 2);
        equal($root.children().eq(0).children().eq(1).children().eq(0).find("p").html(), "g0p0");
        equal($root.children().eq(0).children().eq(1).children().eq(0).find("span").html(), 0);
        equal($root.children().eq(0).children().eq(1).children().eq(0).find("span").text(), 0);
        equal($root.children().eq(0).children().eq(1).children().eq(1).find("p").html(), "g0p1");
        equal($root.children().eq(0).children().eq(1).children().eq(1).find("span").html(), 1);
        equal($root.children().eq(0).children().eq(1).children().eq(1).find("span").text(), 1);

        data.get("groups").push(Observable({
            name: "g3",
            persons: Observable([
                Observable({
                    name: "g1p5",
                    age: 7
                })
            ])
        }));
        equal($root.children().eq(1).children().length, 2);
        equal($root.children().eq(1).children().eq(0).html(), "g3");
        equal($root.children().eq(1).children().eq(0).text(), "g3");
        equal($root.children().eq(1).children().eq(1).children().length, 1);
        equal($root.children().eq(1).children().eq(1).children().eq(0).find("p").html(), "g1p5");
        equal($root.children().eq(1).children().eq(1).children().eq(0).find("span").html(), 7);
        equal($root.children().eq(1).children().eq(1).children().eq(0).find("span").text(), 7);

        dataUnbind(root);
        equal($root.children("li").length, 2);
        equal($root.children("li").eq(0).children("ul").children("li").length, 2);
        equal($root.children("li").eq(1).children("ul").children("li").length, 1);

        data.get("groups").get(0).get("persons").push(Observable({
            name: "g1p6",
            age: 8
        }));
        equal($root.children("li").length, 2);
        equal($root.children("li").eq(0).children("ul").children("li").length, 2);
        equal($root.children("li").eq(1).children("ul").children("li").length, 1);

        data.get("groups").pop();
        equal($root.children("li").length, 2);
        equal($root.children("li").eq(0).children("ul").children("li").length, 2);
        equal($root.children("li").eq(1).children("ul").children("li").length, 1);
    });

    test("Can bind with this key", function() {
        var $root = $('<div data-bind="textContent: this"></div>');
        var root = $root[0];
        var data = "abc";
        dataBind(root, data);
        equal($root.html(), "abc");
        equal($root.text(), "abc");
        dataUnbind(root);

        $root = $('<ul data-each="this"><li data-bind="textContent: this"></li></ul>');
        root = $root[0];
        data = Observable([
            "p0",
            "p1"
        ]);
        dataBind(root, data);
        equal($root.children("li").length, 2);
        equal($root.children("li").eq(0).html(), "p0");
        equal($root.children("li").eq(0).text(), "p0");
        equal($root.children("li").eq(1).html(), "p1");
        equal($root.children("li").eq(1).text(), "p1");

        data.push("p2");
        equal($root.children("li").length, 3);
        equal($root.children("li").eq(0).html(), "p0");
        equal($root.children("li").eq(0).text(), "p0");
        equal($root.children("li").eq(1).html(), "p1");
        equal($root.children("li").eq(1).text(), "p1");
        equal($root.children("li").eq(2).html(), "p2");
        equal($root.children("li").eq(2).text(), "p2");

        data.set(1, "p3");
        equal($root.children("li").eq(0).html(), "p0");
        equal($root.children("li").eq(0).text(), "p0");
        equal($root.children("li").eq(1).html(), "p3");
        equal($root.children("li").eq(1).text(), "p3");
        equal($root.children("li").eq(2).html(), "p2");
        equal($root.children("li").eq(2).text(), "p2");
    });

    test("Can bind form element property back to data and can unbind", function() {
        var $root = $('<div><input type="text" data-bind="value: textValue" data-bindback="value: textValue" /><input type="button" data-bind="value: buttonText; click: buttonClick" /><div data-bind="textContent: textValue"></div></div>');
        var root = $root[0];
        var data = Observable({
            textValue: "",
            buttonText: "The button text",
            buttonClick: function() {
                data.set("textValue", "reset");
            }
        });
        dataBind(root, data);
        equal($root.find("input[type='text']").val(), "");
        equal($root.find("div").text(), "");
        equal($root.find("input[type='button']").val(), "The button text");

        $root.find("input[type='text']").val("aa");
        equal($root.find("input[type='text']").val(), "aa");
        if (browser.document.onpropertychange !== undefined) { // Only IE monitors DOM change.
            equal(data.get("textValue"), "aa");
            equal($root.find("div").text(), "aa");
        }

        $root.find("input[type='button']")[0].click();
        equal(data.get("textValue"), "reset");
        equal($root.find("input[type='text']").val(), "reset");
        equal($root.find("div").text(), "reset");

        dataUnbind(root);
        $root.find("input[type='text']").val("bb");
        equal($root.find("input[type='text']").val(), "bb");
        if (browser.document.onpropertychange !== undefined) { // Only IE monitors DOM change.
            equal(data.get("textValue"), "reset");
            equal($root.find("div").text(), "reset");
        }
    });

    test("Can have converter", 0, function() {

    });

}(this.window, !this.window && require, this.jsMVC || jsMVC));

/// <reference path="../source/_references.js"/>
/// <reference path="../tools/_references.js"/>

(function(browser, node, jsMVC, undefined) {
    "use strict";

    QUnit.module("jsMVC.observable");

    var Observable = jsMVC.Observable;

    test("Can create Observable object", function () {
        var count = 0;

        var person = Observable({
            firstName: "A",
            lastName: "B",
            age: 28
        }).add("fullName", function (firstName, lastName) {
            return firstName + " " + lastName;
        }, ["firstName", "lastName"]).on(function (firstName) {
            equal(firstName, "C");
            count++;
            equal(count, 2);
        }, "firstName").on("change", function (lastName) {
            equal(lastName, "D");
            count++;
            equal(count, 4);
        }, "lastName").on(function (fullName) {
            ok(fullName === "C B" || fullName === "C D");
            count++;
        }, "fullName");

        equal(person.get("firstName"), "A");
        equal(person.get("lastName"), "B");
        equal(person.get("fullName"), "A B");
        person.set("firstName", "C");
        person.set("lastName", "D");
        equal(person.get("fullName"), "C D");
        equal(count, 4);
    });

    test("Can create Observable array", function () {
        var count = 0;

        var person = Observable(["A", "B"]).add("C").on("change", function (item) {
            equal(item, "D");
            count++;
            equal(count, 1);
        }, 0).on("change", function (item) {
            equal(item, "E");
            count++;
            equal(count, 2);
        }, 1).on("change", function (item) {
            equal(item, "F");
            count++;
            equal(count, 3);
        }, 2).on("add", function (item, _, event, index) {
            equal(item, "G");
            equal(_, undefined);
            equal(event, "add");
            equal(index, 3);
            count++;
            equal(count, 4);
        });

        equal(person.length(), 3);
        equal(person.get(0), "A");
        equal(person.get(1), "B");
        equal(person.get(2), "C");
        person.set(0, "D");
        person.set(1, "E");
        person.set(2, "F");
        equal(person.get(2), "F");
        person.add("G");
        equal(count, 4);
        equal(person.length(), 4);
    });
    
    test("Set identical value will not fire change event", function() {
        var count = 0;

        var person = Observable({
            firstName: "A",
            lastName: "B",
            age: 28
        }).add("fullName", function(firstName, lastName) {
            return firstName + " " + lastName;
        }, ["firstName", "lastName"]).on(function(firstName) {
            equal(firstName, "C");
            count++;
            equal(count, 2);
        }, "firstName").on("change", function(lastName) {
            equal(lastName, "D");
            count++;
            equal(count, 4);
        }, "lastName").on(function(fullName) {
            ok(fullName === "C B" || fullName === "C D");
            count++;
        }, "fullName");

        equal(person.get("firstName"), "A");
        equal(person.get("lastName"), "B");
        equal(person.get("fullName"), "A B");
        person.set("firstName", "C");
        equal(count, 2);
        person.set("firstName", "C");
        person.set("lastName", "B");
        equal(count, 2);
        person.set("lastName", "D");
        equal(person.get("fullName"), "C D");
        equal(count, 4);
        person.set("firstName", "C");
        person.set("lastName", "D");
        equal(count, 4);
    });

}(this.window, !this.window && require, this.jsMVC || jsMVC));

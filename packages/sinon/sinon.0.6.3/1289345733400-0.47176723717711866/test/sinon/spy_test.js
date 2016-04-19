/*jslint indent: 2, onevar: false, eqeqeq: false*/
/*globals testCase,
          window,
          sinon,
          fail,
          assert,
          assertUndefined,
          assertFalse,
          assertArray,
          assertFunction,
          assertNumber,
          assertNoException,
          assertSame,
          assertNotSame,
          assertEquals*/
/**
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010 Christian Johansen
 */
(function () {
  testCase("SpyCreateTest", {
    "should be function": function () {
      assertFunction(sinon.spy.create);
    },

    "should not throw if called without function": function () {
      assertNoException(function () {
        sinon.spy.create();
      });
    },

    "should not throw when calling anonymous spy": function () {
      var spy = sinon.spy.create();

      assertNoException(function () {
        spy();
      });

      assert(spy.called);
    },

    "should return spy function": function () {
      var func = function () {};
      var spy = sinon.spy.create(func);

      assertFunction(spy);
      assertNotSame(spy, func);
    },

    "should mirror custom properties on function": function () {
      var func = function () {};
      func.myProp = 42;
      var spy = sinon.spy.create(func);

      assertEquals(func.myProp, spy.myProp);
    },

    "should not define create method": function () {
      var spy = sinon.spy.create();

      assertUndefined(spy.create);
    },

    "should not overwrite original create property": function () {
      var func = function () {};
      var object = func.create = {};
      var spy = sinon.spy.create(func);

      assertSame(object, spy.create);
    },

    "should setup logging arrays": function () {
      var spy = sinon.spy.create();

      assertArray(spy.args);
      assertArray(spy.returnValues);
      assertArray(spy.thisValues);
      assertArray(spy.exceptions);
    }
  });

  testCase("SpyCallTest", {
    "should call underlying function": function () {
      var called = false;

      var spy = sinon.spy.create(function () {
        called = true;
      });

      spy();

      assert(called);
    },

    "should pass arguments to function": function () {
      var actualArgs;

      var func = function () {
        actualArgs = arguments;
      };

      var args = [1, {}, [], ""];
      var spy = sinon.spy.create(func);
      spy(args[0], args[1], args[2], args[3]);

      assertEquals(args, actualArgs);
    },

    "should maintain this binding": function () {
      var actualThis;

      var func = function () {
        actualThis = this;
      };

      var object = {};
      var spy = sinon.spy.create(func);
      spy.call(object);

      assertSame(object, actualThis);
    },

    "should return function's return value": function () {
      var object = {};

      var func = function () {
        return object;
      };

      var spy = sinon.spy.create(func);
      var actualReturn = spy();

      assertSame(object, actualReturn);
    },

    "should throw if function throws": function () {
      var err = new Error();
      var spy = sinon.spy.create(function () {
        throw err;
      });

      try {
        spy();
        fail("Expected spy to throw exception");
      } catch (e) {
        assertSame(err, e);
      }
    }
  });

  testCase("SpyCalledTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should be false prior to calling the spy": function () {
      assertFalse(this.spy.called);
    },

    "should be true after calling the spy once": function () {
      this.spy();

      assert(this.spy.called);
    },

    "should be true after calling the spy twice": function () {
      this.spy();
      this.spy();

      assert(this.spy.called);
    }
  });

  testCase("SpyCalledOnceTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should be false prior to calling the spy": function () {
      assertFalse(this.spy.calledOnce);
    },

    "should be true after calling the spy once": function () {
      this.spy();

      assert(this.spy.calledOnce);
    },

    "should be false after calling the spy twice": function () {
      this.spy();
      this.spy();

      assertFalse(this.spy.calledOnce);
    }
  });

  testCase("SpyCalledTwiceTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should be false prior to calling the spy": function () {
      assertFalse(this.spy.calledTwice);
    },

    "should be false after calling the spy once": function () {
      this.spy();

      assertFalse(this.spy.calledTwice);
    },

    "should be true after calling the spy twice": function () {
      this.spy();
      this.spy();

      assert(this.spy.calledTwice);
    },

    "should be false after calling the spy thrice": function () {
      this.spy();
      this.spy();
      this.spy();

      assertFalse(this.spy.calledTwice);
    }
  });

  testCase("SpyCalledThriceTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should be false prior to calling the spy": function () {
      assertFalse(this.spy.calledThrice);
    },

    "should be false after calling the spy twice": function () {
      this.spy();
      this.spy();

      assertFalse(this.spy.calledThrice);
    },

    "should be true after calling the spy thrice": function () {
      this.spy();
      this.spy();
      this.spy();

      assert(this.spy.calledThrice);
    },

    "should be false after calling the spy four times": function () {
      this.spy();
      this.spy();
      this.spy();
      this.spy();

      assertFalse(this.spy.calledThrice);
    }
  });

  testCase("SpyCallCountTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should report 0 calls": function () {
      assertEquals(0, this.spy.callCount);
    },

    "should record one call": function () {
      this.spy();

      assertEquals(1, this.spy.callCount);
    },

    "should record two calls": function () {
      this.spy();
      this.spy();

      assertEquals(2, this.spy.callCount);
    },

    "should increase call count for each call": function () {
      this.spy();
      this.spy();
      assertEquals(2, this.spy.callCount);

      this.spy();
      assertEquals(3, this.spy.callCount);
    }
  });

  testCase("SpyCalledOnTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should be false if spy wasn't called": function () {
      assertFalse(this.spy.calledOn({}));
    },

    "should be true if called with thisObj": function () {
      var object = {};
      this.spy.call(object);

      assert(this.spy.calledOn(object));
    },

    "should be true if called on object at least once": function () {
      var object = {};
      this.spy();
      this.spy.call({});
      this.spy.call(object);
      this.spy.call(window);

      assert(this.spy.calledOn(object));
    },

    "should return false if not called on object": function () {
      var object = {};
      this.spy.call(object);
      this.spy();

      assertFalse(this.spy.calledOn({}));
    }
  });

  testCase("SpyAlwaysCalledOnTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should be false prior to calling the spy": function () {
      assertFalse(this.spy.alwaysCalledOn({}));
    },

    "should be true if called with thisObj once": function () {
      var object = {};
      this.spy.call(object);

      assert(this.spy.alwaysCalledOn(object));
    },

    "should be true if called with thisObj many times": function () {
      var object = {};
      this.spy.call(object);
      this.spy.call(object);
      this.spy.call(object);
      this.spy.call(object);

      assert(this.spy.alwaysCalledOn(object));
    },

    "should be false if called with another object atleast once": function () {
      var object = {};
      this.spy.call(object);
      this.spy.call(object);
      this.spy.call(object);
      this.spy();
      this.spy.call(object);

      assertFalse(this.spy.alwaysCalledOn(object));
    },

    "should be false if never called with expected object": function () {
      var object = {};
      this.spy();
      this.spy();
      this.spy();

      assertFalse(this.spy.alwaysCalledOn(object));
    }
  });

  testCase("SpyThisValueTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should contain one object": function () {
      var object = {};
      this.spy.call(object);

      assertEquals([object], this.spy.thisValues);
    },

    "should stack up objects": function () {
      function MyConstructor() {}
      var objects = [{}, [], new MyConstructor(), { id: 243 }];
      this.spy();
      this.spy.call(objects[0]);
      this.spy.call(objects[1]);
      this.spy.call(objects[2]);
      this.spy.call(objects[3]);

      assertEquals([this].concat(objects), this.spy.thisValues);
    }
  });

  testCase("SpyCalledWithTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should return false if spy was not called": function () {
      assertFalse(this.spy.calledWith(1, 2, 3));
    },

    "should return true if spy was called with args": function () {
      this.spy(1, 2, 3);

      assert(this.spy.calledWith(1, 2, 3));
    },

    "should return true if called with args at least once": function () {
      this.spy(1, 3, 3);
      this.spy(1, 2, 3);
      this.spy(3, 2, 3);

      assert(this.spy.calledWith(1, 2, 3));
    },

    "should return false if not called with args": function () {
      this.spy(1, 3, 3);
      this.spy(2);
      this.spy();

      assertFalse(this.spy.calledWith(1, 2, 3));
    },

    "should return true for partial match": function () {
      this.spy(1, 3, 3);
      this.spy(2);
      this.spy();

      assert(this.spy.calledWith(1, 3));
    },

    "should match all arguments individually, not as array": function () {
      this.spy([1, 2, 3]);

      assertFalse(this.spy.calledWith(1, 2, 3));
    }
  });

  testCase("SpyAlwaysCalledWithTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should return false if spy was not called": function () {
      assertFalse(this.spy.alwaysCalledWith(1, 2, 3));
    },

    "should return true if spy was called with args": function () {
      this.spy(1, 2, 3);

      assert(this.spy.alwaysCalledWith(1, 2, 3));
    },

    "should return false if called with args only once": function () {
      this.spy(1, 3, 3);
      this.spy(1, 2, 3);
      this.spy(3, 2, 3);

      assertFalse(this.spy.alwaysCalledWith(1, 2, 3));
    },

    "should return false if not called with args": function () {
      this.spy(1, 3, 3);
      this.spy(2);
      this.spy();

      assertFalse(this.spy.alwaysCalledWith(1, 2, 3));
    },

    "should return true for partial match": function () {
      this.spy(1, 3, 3);

      assert(this.spy.alwaysCalledWith(1, 3));
    },

    "should return true for partial match on many calls": function () {
      this.spy(1, 3, 3);
      this.spy(1, 3);
      this.spy(1, 3, 4, 5);
      this.spy(1, 3, 1);

      assert(this.spy.alwaysCalledWith(1, 3));
    },

    "should match all arguments individually, not as array": function () {
      this.spy([1, 2, 3]);

      assertFalse(this.spy.alwaysCalledWith(1, 2, 3));
    }
  });

  testCase("SpyArgsTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should contain real arrays": function () {
      this.spy();

      assertArray(this.spy.args[0]);
    },

    "should contain empty array when no arguments": function () {
      this.spy();

      assertEquals([[]], this.spy.args);
    },

    "should contain array with first call's arguments": function () {
      this.spy(1, 2, 3);

      assertEquals([[1, 2, 3]], this.spy.args);
    },

    "should stack up arguments in nested array": function () {
      var objects = [{}, [], { id: 324 }];
      this.spy(1, objects[0], 3);
      this.spy(1, 2, objects[1]);
      this.spy(objects[2], 2, 3);

      assertEquals([[1, objects[0], 3],
                    [1, 2, objects[1]],
                    [objects[2], 2, 3]], this.spy.args);
    }
  });

  testCase("CalledWithExactlyTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should return false for partial match": function () {
      this.spy(1, 2, 3);

      assertFalse(this.spy.calledWithExactly(1, 2));
    },

    "should return false for missing arguments": function () {
      this.spy(1, 2, 3);

      assertFalse(this.spy.calledWithExactly(1, 2, 3, 4));
    },

    "should return true for exact match": function () {
      this.spy(1, 2, 3);

      assert(this.spy.calledWithExactly(1, 2, 3));
    },

    "should match by strict comparison": function () {
      this.spy({}, []);

      assertFalse(this.spy.calledWithExactly({}, [], null));
    },

    "should return true for one exact match": function () {
      var object = {};
      var array = [];
      this.spy({}, []);
      this.spy(object, []);
      this.spy(object, array);

      assert(this.spy.calledWithExactly(object, array));
    }
  });

  testCase("AlwaysCalledWithExactlyTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
    },

    "should return false for partial match": function () {
      this.spy(1, 2, 3);

      assertFalse(this.spy.alwaysCalledWithExactly(1, 2));
    },

    "should return false for missing arguments": function () {
      this.spy(1, 2, 3);

      assertFalse(this.spy.alwaysCalledWithExactly(1, 2, 3, 4));
    },

    "should return true for exact match": function () {
      this.spy(1, 2, 3);

      assert(this.spy.alwaysCalledWithExactly(1, 2, 3));
    },

    "should return false for excess arguments": function () {
      this.spy({}, []);

      assertFalse(this.spy.alwaysCalledWithExactly({}, [], null));
    },

    "should return false for one exact match": function () {
      var object = {};
      var array = [];
      this.spy({}, []);
      this.spy(object, []);
      this.spy(object, array);

      assert(this.spy.alwaysCalledWithExactly(object, array));
    },

    "should return true for only exact matches": function () {
      var object = {};
      var array = [];

      this.spy(object, array);
      this.spy(object, array);
      this.spy(object, array);

      assert(this.spy.alwaysCalledWithExactly(object, array));
    },

    "should return false for no exact matches": function () {
      var object = {};
      var array = [];

      this.spy(object, array, null);
      this.spy(object, array, undefined);
      this.spy(object, array, "");

      assertFalse(this.spy.alwaysCalledWithExactly(object, array));
    }
  });

  testCase("SpyThrewTest", {
    setUp: function () {
      this.spy = sinon.spy.create();

      this.spyWithTypeError = sinon.spy.create(function () {
        throw new TypeError();
      });
    },

    "should return exception thrown by function": function () {
      var err = new Error();

      var spy = sinon.spy.create(function () {
        throw err;
      });

      try {
        spy();
      } catch (e) {}

      assert(spy.threw(err));
    },

    "should return false if spy did not throw": function () {
      this.spy();

      assertFalse(this.spy.threw());
    },

    "should return true if spy threw": function () {
      try {
        this.spyWithTypeError();
      } catch (e) {}

      assert(this.spyWithTypeError.threw());
    },

    "should return true if string type matches": function () {
      try {
        this.spyWithTypeError();
      } catch (e) {}

      assert(this.spyWithTypeError.threw("TypeError"));
    },

    "should return false if string did not match": function () {
      try {
        this.spyWithTypeError();
      } catch (e) {}

      assertFalse(this.spyWithTypeError.threw("Error"));
    },

    "should return false if spy did not throw specified error": function () {
      this.spy();

      assertFalse(this.spy.threw("Error"));
    }
  });

  testCase("SpyAlwaysThrewTest", {
    setUp: function () {
      this.spy = sinon.spy.create();

      this.spyWithTypeError = sinon.spy.create(function () {
        throw new TypeError();
      });
    },

    "should return true when spy threw": function () {
      var err = new Error();

      var spy = sinon.spy.create(function () {
        throw err;
      });

      try {
        spy();
      } catch (e) {}

      assert(spy.alwaysThrew(err));
    },

    "should return false if spy did not throw": function () {
      this.spy();

      assertFalse(this.spy.alwaysThrew());
    },

    "should return true if spy threw": function () {
      try {
        this.spyWithTypeError();
      } catch (e) {}

      assert(this.spyWithTypeError.alwaysThrew());
    },

    "should return true if string type matches": function () {
      try {
        this.spyWithTypeError();
      } catch (e) {}

      assert(this.spyWithTypeError.alwaysThrew("TypeError"));
    },

    "should return false if string did not match": function () {
      try {
        this.spyWithTypeError();
      } catch (e) {}

      assertFalse(this.spyWithTypeError.alwaysThrew("Error"));
    },

    "should return false if spy did not throw specified error": function () {
      this.spy();

      assertFalse(this.spy.alwaysThrew("Error"));
    },

    "should return false if some calls did not throw": function () {
      var spy = sinon.stub.create(function () {
        if (spy.callCount === 0) {
          throw new Error();
        }
      });

      try {
        this.spy();
      } catch (e) {}

      this.spy();

      assertFalse(this.spy.alwaysThrew());
    },

    "should return true if all calls threw": function () {
      try {
        this.spyWithTypeError();
      } catch (e1) {}

      try {
        this.spyWithTypeError();
      } catch (e2) {}

      assert(this.spyWithTypeError.alwaysThrew());
    },

    "should return true if all calls threw same type": function () {
      try {
        this.spyWithTypeError();
      } catch (e1) {}

      try {
        this.spyWithTypeError();
      } catch (e2) {}

      assert(this.spyWithTypeError.alwaysThrew("TypeError"));
    }
  });

  testCase("SpyExceptionsTest", {
    setUp: function () {
      this.spy = sinon.spy.create();
      var error = this.error = {};

      this.spyWithTypeError = sinon.spy.create(function () {
        throw error;
      });
    },

    "should contain exception thrown by function": function () {
      try {
        this.spyWithTypeError();
      } catch (e) {}

      assertEquals([this.error], this.spyWithTypeError.exceptions);
    },

    "should contain undefined entry when function did not throw": function () {
      this.spy();

      assertEquals(1, this.spy.exceptions.length);
      assertUndefined(this.spy.exceptions[0]);
    },

    "should stack up exceptions and undefined": function () {
      var calls = 0;
      var err = this.error;

      var spy = sinon.spy.create(function () {
        calls += 1;

        if (calls % 2 === 0) {
          throw err;
        }
      });

      spy();

      try {
        spy();
      } catch (e1) {}

      spy();

      try {
        spy();
      } catch (e2) {}

      spy();

      assertEquals(5, spy.exceptions.length);
      assertUndefined(spy.exceptions[0]);
      assertEquals(err, spy.exceptions[1]);
      assertUndefined(spy.exceptions[2]);
      assertEquals(err, spy.exceptions[3]);
      assertUndefined(spy.exceptions[4]);
    }
  });

  testCase("SpyReturnedTest", {
    "should return true when no argument": function () {
      var spy = sinon.spy.create();
      spy();

      assert(spy.returned());
    },

    "should return true for undefined when no explicit return": function () {
      var spy = sinon.spy.create();
      spy();

      assert(spy.returned(undefined));
    },

    "should return true when returned value once": function () {
      var values = [{}, 2, "hey", function () {}];
      var spy = sinon.spy.create(function () {
        return values[spy.callCount];
      });

      spy();
      spy();
      spy();
      spy();

      assert(spy.returned(values[3]));
    },

    "should return false when value is never returned": function () {
      var values = [{}, 2, "hey", function () {}];
      var spy = sinon.spy.create(function () {
        return values[spy.callCount];
      });

      spy();
      spy();
      spy();
      spy();

      assertFalse(spy.returned({ id: 42 }));
    },

    "should return true when value is returned several times": function () {
      var object = { id: 42 };
      var spy = sinon.spy.create(function () {
        return object;
      });

      spy();
      spy();
      spy();

      assert(spy.returned(object));
    },

    "should compare values strictly": function () {
      var object = { id: 42 };
      var spy = sinon.spy.create(function () {
        return object;
      });

      spy();

      assertFalse(spy.returned({ id: 42 }));
    }
  });

  testCase("SpyReturnValuesTest", {
    "should contain undefined when function does not return explicitly": function () {
      var spy = sinon.spy.create();
      spy();

      assertEquals(1, spy.returnValues.length);
      assertUndefined(spy.returnValues[0]);
    },

    "should contain return value": function () {
      var object = { id: 42 };

      var spy = sinon.spy.create(function () {
        return object;
      });

      spy();

      assertEquals([object], spy.returnValues);
    },

    "should contain undefined when function throws": function () {
      var spy = sinon.spy.create(function () {
        throw new Error();
      });

      try {
        spy();
      } catch (e) {
      }

      assertEquals(1, spy.returnValues.length);
      assertUndefined(spy.returnValues[0]);
    },

    "should stack up return values": function () {
      var calls = 0;

      var spy = sinon.spy.create(function () {
        calls += 1;

        if (calls % 2 === 0) {
          return calls;
        }
      });

      spy();
      spy();
      spy();
      spy();
      spy();

      assertEquals(5, spy.returnValues.length);
      assertUndefined(spy.returnValues[0]);
      assertEquals(2, spy.returnValues[1]);
      assertUndefined(spy.returnValues[2]);
      assertEquals(4, spy.returnValues[3]);
      assertUndefined(spy.returnValues[4]);
    }
  });

  testCase("SpyCalledBeforeTest", {
    setUp: function () {
      this.spy1 = sinon.spy();
      this.spy2 = sinon.spy();
    },

    "should be function": function () {
      assertFunction(this.spy1.calledBefore);
    },

    "should return true if first call to A was before first to B": function () {
      this.spy1();
      this.spy2();

      assert(this.spy1.calledBefore(this.spy2));
    },

    "should return false if not called": function () {
      this.spy2();

      assertFalse(this.spy1.calledBefore(this.spy2));
    },

    "should return true if other not called": function () {
      this.spy1();

      assert(this.spy1.calledBefore(this.spy2));
    },

    "should return false if other called first": function () {
      this.spy2();
      this.spy1();
      this.spy2();

      assertFalse(this.spy1.calledBefore(this.spy2));
    }
  });

  testCase("SpyCalledAfterTest", {
    setUp: function () {
      this.spy1 = sinon.spy();
      this.spy2 = sinon.spy();
    },

    "should be function": function () {
      assertFunction(this.spy1.calledAfter);
    },

    "should return true if first call to A was after first to B": function () {
      this.spy2();
      this.spy1();

      assert(this.spy1.calledAfter(this.spy2));
    },

    "should return false if not called": function () {
      this.spy2();

      assertFalse(this.spy1.calledAfter(this.spy2));
    },

    "should return false if other not called": function () {
      this.spy1();

      assertFalse(this.spy1.calledAfter(this.spy2));
    },

    "should return false if other called last": function () {
      this.spy2();
      this.spy1();
      this.spy2();

      assertFalse(this.spy1.calledAfter(this.spy2));
    }
  });

  function spyCallSetUp() {
    this.thisObj = {};
    this.args = [{}, [], function () {}, 3];
    this.returnValue = function () {};
    this.call = sinon.spyCall.create(this.thisObj, this.args, this.returnValue);
  }

  testCase("SpyCallObjectTest", {
    setUp: spyCallSetUp,

    "should get call object": function () {
      var spy = sinon.spy.create();
      spy();
      var firstCall = spy.getCall(0);

      assertFunction(firstCall.calledOn);
      assertFunction(firstCall.calledWith);
      assertFunction(firstCall.returned);
    },

    "should record call id": function () {
      assertNumber(this.call.callId);
    },

    "should record ascending call id's": function () {
      var spy = sinon.spy();
      spy();

      assert(this.call.callId < spy.getCall(0).callId);
    }
  });

  testCase("SpyCallCalledOnTest", {
    setUp: spyCallSetUp,

    "calledOn should return true": function () {
      assert(this.call.calledOn(this.thisObj));
    },

    "calledOn should return false": function () {
      assertFalse(this.call.calledOn({}));
    }
  });

  testCase("SpyCallCalledWithTest", {
    setUp: spyCallSetUp,

    "should return true if all args match": function () {
      var args = this.args;

      assert(this.call.calledWith(args[0], args[1], args[2]));
    },

    "should return true if first args match": function () {
      var args = this.args;

      assert(this.call.calledWith(args[0], args[1]));
    },

    "should return true if first arg match": function () {
      var args = this.args;

      assert(this.call.calledWith(args[0]));
    },

    "should return true for no args": function () {
      assert(this.call.calledWith());
    },

    "should return false for too many args": function () {
      var args = this.args;

      assertFalse(this.call.calledWith(args[0], args[1], args[2], {}));
    },

    "should return false for wrong arg": function () {
      var args = this.args;

      assertFalse(this.call.calledWith(args[0], args[2]));
    }
  });

  testCase("SpyCallCalledWithExactlyTest", {
    setUp: spyCallSetUp,

    "should return true when all args match": function () {
      var args = this.args;

      assert(this.call.calledWithExactly(args[0], args[1], args[2], args[3]));
    },

    "should return false for too many args": function () {
      var args = this.args;

      assertFalse(this.call.calledWithExactly(args[0], args[1], args[2], {}));
    },

    "should return false for too few args": function () {
      var args = this.args;

      assertFalse(this.call.calledWithExactly(args[0], args[1]));
    },

    "should return false for unmatching args": function () {
      var args = this.args;

      assertFalse(this.call.calledWithExactly(args[0], args[1], args[1]));
    },

    "should return true for no arguments": function () {
      var call = sinon.spyCall.create({}, []);

      assert(call.calledWithExactly());
    },

    "should return false when called with no args but matching one": function () {
      var call = sinon.spyCall.create({}, []);

      assertFalse(call.calledWithExactly({}));
    }
  });

  testCase("SpyConstructorTest", {
    setUp: function () {
      this.CustomConstructor = function () {};
      this.customPrototype = this.CustomConstructor.prototype;
      this.StubConstructor = sinon.spy(this, "CustomConstructor");
    },

    "should create original object": function () {
      var myInstance = new this.CustomConstructor();

      assert(this.customPrototype.isPrototypeOf(myInstance));
    },

    "should not interfere with instanceof": function () {
      var myInstance = new this.CustomConstructor();

      assert(myInstance instanceof this.CustomConstructor);
    },

    "should record usage": function () {
      var myInstance = new this.CustomConstructor();

      assert(this.CustomConstructor.called);
    }
  });
}());
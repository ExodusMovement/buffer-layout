/** Support for translating between Buffer instances and JavaScript
 * native types.
 *
 * {@link module:Layout~Layout|Layout} is the basis of a class
 * hierarchy that associates property names with sequences of encoded
 * bytes.
 *
 * Layouts are supported for these scalar (numeric) types:
 * * {@link module:Layout~UInt|Unsigned integers in little-endian
 *   format} with {@link module:Layout.u8|8-bit}, {@link
 *   module:Layout.u16|16-bit}, {@link module:Layout.u24|24-bit},
 *   {@link module:Layout.u32|32-bit}, {@link
 *   module:Layout.u40|40-bit}, and {@link module:Layout.u48|48-bit}
 *   representation ranges;
 * * {@link module:Layout~UIntBE|Unsigned integers in big-endian
 *   format} with {@link module:Layout.u16be|16-bit}, {@link
 *   module:Layout.u24be|24-bit}, {@link module:Layout.u32be|32-bit},
 *   {@link module:Layout.u40be|40-bit}, and {@link
 *   module:Layout.u48be|48-bit} representation ranges;
 * * {@link module:Layout~Int|Signed integers in little-endian
 *   format} with {@link module:Layout.s8|8-bit}, {@link
 *   module:Layout.s16|16-bit}, {@link module:Layout.s24|24-bit},
 *   {@link module:Layout.s32|32-bit}, {@link
 *   module:Layout.s40|40-bit}, and {@link module:Layout.s48|48-bit}
 *   representation ranges;
 * * {@link module:Layout~IntBE|Signed integers in big-endian format}
 *   with {@link module:Layout.s16be|16-bit}, {@link
 *   module:Layout.s24be|24-bit}, {@link module:Layout.s32be|32-bit},
 *   {@link module:Layout.s40be|40-bit}, and {@link
 *   module:Layout.s48be|48-bit} representation ranges;
 * * 32-bit floating point values with {@link
 *   module:Layout.f32|little-endian} and {@link
 *   module:Layout.f32be|big-endian} representations.
 * * 64-bit floating point values with {@link
 *   module:Layout.f64|little-endian} and {@link
 *   module:Layout.f64be|big-endian} representations.
 *
 * and for these aggregate types:
 * * {@link module:Layout~Sequence|Sequence}s of a specific number of
 *   instances of a {@link module:Layout~Layout|Layout}, with
 *   JavaScript representation as an Array;
 * * {@link module:Layout~Structure|Structure}s that aggregate a
 *   heterogeneous sequence of {@link module:Layout~Layout|Layout}
 *   instances, with JavaScript representation as an Object;
 * * {@link module:Layout~Union|Union}s that support multiple {@link
 *   module:Layout~VariantLayout|variant layouts} over the same span
 *   of bytes, using an unsigned integer at the start the span to
 *   determine the layout used to interpret the remainder of the span.
 *
 * All {@link module:Layout~Layout|Layout} instances are immutable
 * after construction, to prevent internal state from becoming
 * inconsistent.
 *
 * @local Layout
 * @local UInt
 * @local UIntBE
 * @local Int
 * @local IntBE
 * @local Float
 * @local FloatBE
 * @local Double
 * @local DoubleBE
 * @local Sequence
 * @local Structure
 * @local Union
 * @local VariantLayout
 * @module Layout
 * @license MIT
 * @author Peter A. Bigot
 * @see {@link https://github.com/pabigot/buffer-layout|buffer-layout on GitHub}
 */

/*jslint
    bitwise:true, this:true, white:true
 */
/*jshint -W034 */
"use strict";

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger */
Number.isInteger = Number.isInteger || function(value) {
    return typeof value === "number" &&
           isFinite(value) &&
           Math.floor(value) === value;
};

/* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign */
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(nextSource);
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

/** Base class for layout objects.
 *
 * **NOTE** This is an abstract base class; you can create instances
 * if it amuses you, but they won't support the {@link
 * Layout#encode|encode} or {@link Layout#decode|decode} functions.
 *
 * **NOTE** All instances of concrete extensions of this class are
 * frozen prior to being returned from the constructor so that state
 * relationships between layouts are not inadvertently corrupted.
 *
 * @param {Number} span - Default for {@link Layout#span|span}.  The
 * parameter must be a positive integer.
 *
 * @param {string} [property] - Default for {@link
 * Layout#property|property}.
 *
 * @constructor */
function Layout (span, property) {
    if ((! Number.isInteger(span)) || (0 >= span)) {
        throw new TypeError("span must be positive integer");
    }
    /** The span of the layout in bytes. */
    this.span = span;
    /** The property name used when this layout is represented in an
     * Object.
     *
     * Used only for layouts that {@link Layout#decode|decode} to
     * Object instances.  If left undefined the corresponding span of
     * bytes will be treated as padding: it will not be mutated by
     * {@link Layout#encode|encode} nor represented as a property in
     * the decoded Object. */
    this.property = property;
}

/** Decode from a Buffer into an JavaScript value.
 *
 * @param {Buffer} b - the buffer from which encoded data is read.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred.
 *
 * @param {Object} [dest] - the Object into which properties will be
 * assigned.  This only applies to {@link Structure|Structure} layouts
 * (including the {@link Union#layout|default Union layout} and
 * compatible {@link VariantLayout|variant layouts}) since other
 * layouts return non-Object results.  If required but not provided an
 * empty Object will be used as the destination.
 *
 * @returns {(Number|Array|Object)} - the value of the decoded data. */
Layout.prototype.decode = function () {
    throw new Error('Layout is abstract');
};

/** Encode a JavaScript value into a Buffer.
 *
 * @param {(Number|Array|Object)} src - the value to be encoded into
 * the buffer.  The type accepted depends on the (sub-)type of {@link
 * Layout|Layout}.
 *
 * @param {Buffer} b - the buffer into which encoded data will be
 * written.
 *
 * @param {Number} [offset] - the offset at which the encoded data
 * starts.  If absent a zero offset is inferred. */
Layout.prototype.encode = function () {
    throw new Error('Layout is abstract');
};

/** Replicate the layout using a new property.
 *
 * This function must be used to get a structurally-equivalent layout
 * with a different name since all {@link Layout|Layout} instances are
 * immutable.
 *
 * **NOTE** This is a shallow copy.  All fields except {@link
 * Layout#property|property} are strictly equal to the origin layout.
 *
 * @param property - the value for {@link Layout#property|property} in
 * the replica.
 *
 * @returns {Layout} - the copy with {@link Layout#property|property}
 * set to `property`. */
Layout.prototype.replicate = function (property) {
    var rv = Object.create(this.constructor.prototype);
    Object.assign(rv, this);
    rv.property = property;
    Object.freeze(rv);
    return rv;
};

/** Create an object from layout properties and an array of values.
 *
 * **NOTE** This function returns `undefined` if invoked on a layout
 * that does not return its value as an Object.  That would generally
 * be anything that isn't fundamentally a {@link Structure|Structure},
 * which includes {@link VariantLayout|variant layouts} if they are
 * structures, and excludes {@link Union|Union}s.  If you want this
 * feature for a union you must use {@link
 * Union.getVariant|getVariant} to select the desired layout.
 *
 * @param {Array} values - an array of values that correspond to the
 * default order for properties.  As with {@link Layout#decode|decode}
 * layout elements that have no property name are skipped when
 * iterating over the array values.  Only the top-level properties are
 * assigned; arguments are not assigned to properties of contained
 * layouts.  Any unused values are ignored.
 *
 * @param {Object} dest - as with {@link Layout#decode|decode}.  If
 * required but not provided an empty Object will be used.
 *
 * @return {(Object|undefined)} */
Layout.prototype.fromArray = function () {
    return undefined;
};

/** Represent an unsigned integer in little-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function UInt (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
UInt.prototype = Object.create(Layout.prototype);
UInt.prototype.constructor = UInt;
/** Implement {@link Layout#decode|decode} for {@link UInt|UInt}. */
UInt.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readUIntLE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link UInt|UInt}. */
UInt.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeUIntLE(src, offset, this.span);
};

/** Represent an unsigned integer in big-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function UIntBE (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
UIntBE.prototype = Object.create(Layout.prototype);
UIntBE.prototype.constructor = UIntBE;
/** Implement {@link Layout#decode|decode} for {@link UIntBE|UIntBE}. */
UIntBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readUIntBE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link UIntBE|UIntBE}. */
UIntBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeUIntBE(src, offset, this.span);
};

/** Represent a signed integer in little-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Int (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
Int.prototype = Object.create(Layout.prototype);
Int.prototype.constructor = Int;
/** Implement {@link Layout#decode|decode} for {@link Int|Int}. */
Int.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readIntLE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link Int|Int}. */
Int.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeIntLE(src, offset, this.span);
};

/** Represent a signed integer in big-endian format.
 *
 * @param {Number} span - initializer for {@link Layout#span|span}.
 * The parameter can range from 1 through 6.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function IntBE (span, property) {
    Layout.call(this, span, property);
    if (6 < this.span) {
        throw new TypeError("span must not exceed 6 bytes");
    }
    Object.freeze(this);
}
IntBE.prototype = Object.create(Layout.prototype);
IntBE.prototype.constructor = IntBE;
/** Implement {@link Layout#decode|decode} for {@link IntBE|IntBE}. */
IntBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readIntBE(offset, this.span);
};
/** Implement {@link Layout#encode|encode} for {@link IntBE|IntBE}. */
IntBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeIntBE(src, offset, this.span);
};

/** Represent a 32-bit floating point number in little-endian format.
 *
 * Factory function is {@link module:Layout.f32|f32}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Float (property) {
    Layout.call(this, 4, property);
    Object.freeze(this);
}
Float.prototype = Object.create(Layout.prototype);
Float.prototype.constructor = Float;
/** Implement {@link Layout#decode|decode} for {@link Float|Float}. */
Float.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readFloatLE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link Float|Float}. */
Float.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeFloatLE(src, offset);
};

/** Represent a 32-bit floating point number in big-endian format.
 *
 * Factory function is {@link module:Layout.f32be|f32be}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function FloatBE (property) {
    Layout.call(this, 4, property);
    Object.freeze(this);
}
FloatBE.prototype = Object.create(Layout.prototype);
FloatBE.prototype.constructor = FloatBE;
/** Implement {@link Layout#decode|decode} for {@link FloatBE|FloatBE}. */
FloatBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readFloatBE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link FloatBE|FloatBE}. */
FloatBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeFloatBE(src, offset);
};

/** Represent a 64-bit floating point number in little-endian format.
 *
 * Factory function is {@link module:Layout.f64|f64}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Double (property) {
    Layout.call(this, 8, property);
    Object.freeze(this);
}
Double.prototype = Object.create(Layout.prototype);
Double.prototype.constructor = Double;
/** Implement {@link Layout#decode|decode} for {@link Double|Double}. */
Double.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readDoubleLE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link Double|Double}. */
Double.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeDoubleLE(src, offset);
};

/** Represent a 64-bit floating point number in big-endian format.
 *
 * Factory function is {@link module:Layout.f64be|f64be}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function DoubleBE (property) {
    Layout.call(this, 8, property);
    Object.freeze(this);
}
DoubleBE.prototype = Object.create(Layout.prototype);
DoubleBE.prototype.constructor = DoubleBE;
/** Implement {@link Layout#decode|decode} for {@link DoubleBE|DoubleBE}. */
DoubleBE.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    return b.readDoubleBE(offset);
};
/** Implement {@link Layout#encode|encode} for {@link DoubleBE|DoubleBE}. */
DoubleBE.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    b.writeDoubleBE(src, offset);
};

/** Represent a contiguous sequence of a specific layout as an Array.
 *
 * @param {Layout} elt_layout - initializer for {@link
 * Sequence#elt_layout|elt_layout}.
 *
 * @param {Number} count - initializer for {@link
 * Sequence#count|count}.  The parameter must be a positive integer.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Sequence (elt_layout, count, property) {
    if (! (elt_layout instanceof Layout)) {
        throw new TypeError("elt_layout must be a Layout");
    }
    if ((! Number.isInteger(count)) || (0 >= count)) {
        throw new TypeError("count must be positive integer");
    }

    Layout.call(this, count * elt_layout.span, property);

    /** The layout for individual elements of the sequence. */
    this.elt_layout = elt_layout;

    /** The number of elements in the sequence. */
    this.count = count;

    Object.freeze(this);
}
Sequence.prototype = Object.create(Layout.prototype);
Sequence.prototype.constructor = Sequence;
/** Implement {@link Layout#decode|decode} for {@link Sequence|Sequence}. */
Sequence.prototype.decode = function (b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var rv = [],
        i = 0;
    while (i < this.count) {
        rv.push(this.elt_layout.decode(b, offset));
        offset += this.elt_layout.span;
        i += 1;
    }
    return rv;
};
/** Implement {@link Layout#encode|encode} for {@link Sequence|Sequence}.
 *
 * **NOTE** If `src` is shorter than {@link Sequence#count|count} then
 * the unused space in the buffer is left unchanged.  If `src` is
 * longer than {@link Sequence#count|count} the unneeded elements are
 * ignored. */
Sequence.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var elo = this.elt_layout;
    src.forEach(function (v) {
        elo.encode(v, b, offset);
        offset += elo.span;
    });
};

/** Represent a contiguous sequence of arbitrary layout elements as an
 * Object.
 *
 * @param {Layout[]} fields - initializer for {@link
 * Structure#fields|fields}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Structure (fields, property) {
    if ((! (fields instanceof Array))
        || (! fields.reduce(function (v, fd) { return v && (fd instanceof Layout); }, true))) {
        throw new TypeError("fields must be array of Layout instances");
    }
    var span = fields.reduce(function (v, fd) { return v+fd.span; }, 0);
    Layout.call(this, span, property);

    /** The sequence of {@link Layout|Layout} values that comprise the
     * structure.
     *
     * The individual elements need not be the same type, and may be
     * either scalar or aggregate layouts.  If a member layout leaves
     * its {@link Layout#property|property} undefined the
     * corresponding region of the buffer associated with the element
     * will not be mutated.
     *
     * @type {Layout[]} */
    this.fields = fields;

    Object.freeze(this);
}
Structure.prototype = Object.create(Layout.prototype);
Structure.prototype.constructor = Structure;
/** Implement {@link Layout#decode|decode} for {@link Structure|Structure}.
 *
 * This layout makes use the `dest` parameter, allowing decoded
 * properties to be stored directly into an existing object (e.g. when
 * used in an object constructor). */
Structure.prototype.decode = function (b, offset, dest) {
    if (undefined === dest) {
        dest = {};
    }
    if (undefined === offset) {
        offset = 0;
    }
    this.fields.map(function (fd) {
        if (undefined !== fd.property) {
            dest[fd.property] = fd.decode(b, offset);
        }
        offset += fd.span;
    });
    return dest;
};
/** Implement {@link Layout#encode|encode} for {@link Structure|Structure}.
 *
 * If `src` is missing a property for a member with a defined {@link
 * Layout#property|property} the corresponding region of the buffer is
 * zero-filled. */
Structure.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    this.fields.forEach(function (fd) {
        if (undefined !== fd.property) {
            var fv = src[fd.property];
            if (undefined === fv) {
                b.fill(0, offset, offset+fd.span);
            } else {
                fd.encode(fv, b, offset);
            }
        }
        offset += fd.span;
    });
};
/** Implement {@link Layout#fromArray|fromArray} for {@link
 * Structure|Structure}. */
Structure.prototype.fromArray = function (values, dest) {
    if (undefined === dest) {
        dest = {};
    }
    this.fields.forEach(function (fd) {
        if ((undefined !== fd.property)
            && (0 < values.length)) {
            dest[fd.property] = values.shift();
        }
    });
    return dest;
};

/** Represent any number of span-compatible layouts.
 *
 * The {@link Layout.span|span} of a union is the sum of the spans of
 * its {@link Union.discr_layout|discriminator} and its {@link
 * Union#default_layout|default layout}.
 *
 * {@link
 * VariantLayout#layout|Variant layout}s are added through {@link
 * Union#addVariant|addVariant} and may be any layout that does not
 * exceed span of the {@link Union#default_layout|default layout}.
 *
 * The variant encoded in a buffer can only be identified from the
 * `content` property (in the case of the {@link
 * Union#default_layout|default layout}), or by using {@link
 * Union#getVariant|getVariant} and examining the resulting {@link
 * VariantLayout|VariantLayout} instance.
 *
 * @param {Layout} discr_layout - initializer for {@link
 * Union#discr_layout|discr_layout}.  The parameter must be an
 * instance of {@link UInt|UInt} (or {@link UIntBE|UIntBE}).
 *
 * @param {Layout} default_layout - initializer for {@link
 * Union#default_layout|default_layout}.
 *
 * @param {string} [property] - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function Union (discr_layout,
                default_layout,
                property) {
    if (! ((discr_layout instanceof UInt)
           || (discr_layout instanceof UIntBE))) {
        throw new TypeError("discr_layout must produce unsigned integer");
    }
    if (! (default_layout instanceof Layout)) {
        throw new TypeError("default_layout must be a Layout");
    }
    var dlo = discr_layout,
        clo = default_layout;
    if (undefined === dlo.property) {
        dlo = dlo.replicate('variant');
    }
    if (undefined === clo.property) {
        clo = clo.replicate('content');
    }
    var layout = new Structure([dlo, clo]);
    Layout.call(this, layout.span, property);

    /** The layout for unrecognized variants.
     *
     * This is a {@link Structure|Structure} layout comprising the
     * {@link Union#discr_layout|discriminator} immediately followed by the
     * {@link Union#default_layout|default layout}.
     *
     * If {@link Union#discr_layout|discr_layout} was not given a
     * {@link Layout#property|property}, `variant` will be used.
     *
     * If {@link Union#default_layout|default_layout} was not given a
     * {@link Layout#property|property}, `content` will be used. */
    this.layout = layout;

    /** The layout for the discriminator value in isolation.
     *
     * This is the value passed to the constructor.  It is
     * structurally equivalent to the first component of {@link
     * Union#layout|layout} but may have a different property name. */
    this.discr_layout = discr_layout;

    /** The layout for non-discriminator content when the value of the
     * discriminator is not recognized.
     *
     * This is the value passed to the constructor.  It is
     * structurally equivalent to the second component of {@link
     * Union#layout|layout} but may have a different property
     * name. */
    this.default_layout = default_layout;

    /** A registry of allowed variants.
     *
     * The keys are unsigned integers which should be compatible with
     * {@link Union.discr_layout|discr_layout}.  The property value is
     * the corresponding {@link VariantLayout|VariantLayout} instances
     * assigned to this union by {@link
     * Union#addVariant|addVariant}.
     *
     * **NOTE** The registry remains mutable so that variants can be
     * {@link Union#addVariant|added} at any time.  Users should not
     * manipulate the content of this property. */
    this.registry = {};

    Object.freeze(this);
}
Union.prototype = Object.create(Layout.prototype);
Union.prototype.constructor = Union;
/** Implement {@link Layout#decode|decode} for {@link Union|Union}. */
Union.prototype.decode = function (b, offset, dest) {
    if (undefined === offset) {
        offset = 0;
    }
    if (undefined === dest) {
        dest = {};
    }
    var dlo = this.discr_layout,
        discr = dlo.decode(b, offset),
        vlo = this.registry[discr];
    if (undefined === vlo) {
        var dpr = this.layout.fields[0].property,
            cpr = this.layout.fields[1].property;
        dest[dpr] = discr;
        dest[cpr] = this.default_layout.decode(b, offset + dlo.span);
    } else {
        dest = vlo.decode(b, offset, dest);
    }
    return dest;
};
/** Implement {@link Layout#encode|encode} for {@link Union|Union}. */
Union.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var dlo = this.discr_layout,
        vlo = this.default_layout,
        discr = src.variant,
        content = src.content;
    if ((undefined === discr) || (undefined === content)) {
        throw new Error("default union encode must be provided variant and content");
    }
    dlo.encode(discr, b, offset);
    vlo.encode(content, b, offset + dlo.span);
};
/** Register a new variant structure within a union.
 *
 * @param {Number} variant - initializer for {@link
 * VariantLayout#variant|variant}.
 *
 * @param {Layout} layout - initializer for {@link
 * VariantLayout#layout|layout}.
 *
 * @param {string} property - initializer for {@link
 * Layout#property|property}.
 *
 * @return {VariantLayout} */
Union.prototype.addVariant = function (variant, layout, property) {
    var rv = new VariantLayout(this, variant, layout, property);
    this.registry[variant] = rv;
    return rv;
};
/** Get the layout associated with a registered variant.
 *
 * If `vb` does not produce a registered variant the function returns
 * `undefined`.
 *
 * @param {(Number|Buffer)} vb - either the variant number, or a
 * buffer from which the discriminator is to be read.
 *
 * @param {Number} offset - offset into `vb` for the start of the
 * union.  Used only when `vb` is an instance of {Buffer}.
 *
 * @return {({VariantLayout}|undefined)} */
Union.prototype.getVariant = function (vb, offset) {
    var variant = vb;
    if (vb instanceof Buffer) {
        if (undefined === offset) {
            offset = 0;
        }
        variant = this.discr_layout.decode(vb, offset);
    }
    return this.registry[variant];
};

/** Represent a specific variant within a containing union.
 *
 * **NOTE** The {@link Layout#span|span} of the variant includes the
 * span of the {@link Union#discr_layout|discriminator} used to
 * identify it, but values read and written using the variant strictly
 * conform to the content of {@link VariantLayout#layout|layout}.
 *
 * **NOTE** User code should not invoke this construtor directly.  Use
 * the union {@link Union#addVariant|addVariant} helper method.
 *
 * @param {Union} union - initializer for {@link
 * VariantLayout#union|union}.
 *
 * @param {Number} variant - initializer for {@link
 * VariantLayout#variant|variant}.
 *
 * @param {Layout} layout - initializer for {@link
 * VariantLayout#layout|layout}.
 *
 * @param {string} property - initializer for {@link
 * Layout#property|property}.
 *
 * @constructor
 * @augments {Layout} */
function VariantLayout (union,
                        variant,
                        layout,
                        property) {
    if (! (union instanceof Union)) {
        throw new TypeError("union must be a Union");
    }
    if ((! Number.isInteger(variant)) || (0 > variant)) {
        throw new TypeError("variant must be a non-negative integer");
    }
    if (! (layout instanceof Layout)) {
        throw new TypeError("layout must be a Layout");
    }
    if (layout.span > union.default_layout.span) {
        throw new Error("layout span exceeds content span of containing union");
    }
    Layout.call(this, layout.span, property);
    this.span += union.discr_layout.span;

    /** The {@link Union|Union} to which this variant belongs. */
    this.union = union;

    /** The unsigned integral value identifying this variant within
     * the {@link Union#discr_layout|discriminator} of the containing
     * union. */
    this.variant = variant;

    /** The {@link Layout|Layout} to be used when reading/writing the
     * non-discriminator part of the {@link
     * VariantLayout#union|union}. */
    this.layout = layout;

    Object.freeze(this);
}
VariantLayout.prototype = Object.create(Layout.prototype);
VariantLayout.prototype.constructor = VariantLayout;
/** Implement {@link Layout#decode|decode} for {@link VariantLayout|VariantLayout}. */
VariantLayout.prototype.decode = function (b, offset, dest) {
    if (undefined === offset) {
        offset = 0;
    }
    var dlo = this.union.discr_layout;
    if (this !== this.union.getVariant(b, offset)) {
        throw new Error("variant mismatch");
    }
    return this.layout.decode(b, offset + dlo.span, dest);
};
/** Implement {@link Layout#encode|encode} for {@link VariantLayout|VariantLayout}. */
VariantLayout.prototype.encode = function (src, b, offset) {
    if (undefined === offset) {
        offset = 0;
    }
    var dlo = this.union.discr_layout;
    dlo.encode(this.variant, b, offset);
    this.layout.encode(src, b, offset + dlo.span);
};
/** Implement {@link Layout#fromArray|fromArray} for {@link
 * VariantLayout|VariantLayout}. */
VariantLayout.prototype.fromArray = function (values, dest) {
    if (this.layout instanceof Structure) {
        return this.layout.fromArray(values, dest);
    }
    return undefined;
};

exports.Layout = Layout;
exports.UInt = UInt;
exports.UIntBE = UIntBE;
exports.Int = Int;
exports.IntBE = IntBE;
exports.Float = Float;
exports.FloatBE = FloatBE;
exports.Double = Double;
exports.DoubleBE = DoubleBE;
exports.Sequence = Sequence;
exports.Structure = Structure;
exports.Union = Union;
exports.VariantLayout = VariantLayout;

/** Factory for {@link UInt|unsigned int layouts} spanning one
 * byte. */
exports.u8 = function (property) { return new UInt(1, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning two bytes. */
exports.u16 = function (property) { return new UInt(2, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning three bytes. */
exports.u24 = function (property) { return new UInt(3, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning four bytes. */
exports.u32 = function (property) { return new UInt(4, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning five bytes. */
exports.u40 = function (property) { return new UInt(5, property); };

/** Factory for {@link UInt|little-endian unsigned int layouts}
 * spanning six bytes. */
exports.u48 = function (property) { return new UInt(6, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning two bytes. */
exports.u16be = function (property) { return new UIntBE(2, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning three bytes. */
exports.u24be = function (property) { return new UIntBE(3, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning four bytes. */
exports.u32be = function (property) { return new UIntBE(4, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning five bytes. */
exports.u40be = function (property) { return new UIntBE(5, property); };

/** Factory for {@link UInt|big-endian unsigned int layouts}
 * spanning six bytes. */
exports.u48be = function (property) { return new UIntBE(6, property); };

/** Factory for {@link Int|signed int layouts} spanning one
 * byte. */
exports.s8 = function (property) { return new Int(1, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning two bytes. */
exports.s16 = function (property) { return new Int(2, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning three bytes. */
exports.s24 = function (property) { return new Int(3, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning four bytes. */
exports.s32 = function (property) { return new Int(4, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning five bytes. */
exports.s40 = function (property) { return new Int(5, property); };

/** Factory for {@link Int|little-endian signed int layouts}
 * spanning six bytes. */
exports.s48 = function (property) { return new Int(6, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning two bytes. */
exports.s16be = function (property) { return new IntBE(2, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning three bytes. */
exports.s24be = function (property) { return new IntBE(3, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning four bytes. */
exports.s32be = function (property) { return new IntBE(4, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning five bytes. */
exports.s40be = function (property) { return new IntBE(5, property); };

/** Factory for {@link Int|big-endian signed int layouts}
 * spanning six bytes. */
exports.s48be = function (property) { return new IntBE(6, property); };

/** Factory for {@link Float|little-endian 32-bit floating point} values. */
exports.f32 = function (property) { return new Float(property); };

/** Factory for {@link FloatBE|big-endian 32-bit floating point} values. */
exports.f32be = function (property) { return new FloatBE(property); };

/** Factory for {@link Double|little-endian 64-bit floating point} values. */
exports.f64 = function (property) { return new Double(property); };

/** Factory for {@link DoubleBE|big-endian 64-bit floating point} values. */
exports.f64be = function (property) { return new DoubleBE(property); };
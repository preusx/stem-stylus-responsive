var nu = require('util'),
    su = require('stylus/lib/utils.js'),
    n = require('stylus/lib/nodes');

module.exports = function() {
  return function(style) {
    var u = style.options.extensions.utils;

    var Config = {
      'anti-overlap':     true,
      'em':               false,
      'use-device-width': false,

      'retina-density':   1.5,
    };

    var Breakpoints = {
      xs: new n.Unit(320, 'px'),
      sm: new n.Unit(480, 'px'),
      md: new n.Unit(720, 'px'),
      lg: new n.Unit(960, 'px'),
      xl: new n.Unit(1280, 'px'),
      hd: new n.Unit(1920, 'px'),
    };


    // Utility functions

    function getVar(self, variable) {
      return self.functions['var'].call(self, new n.String(variable)).nodes[0];
    }


    function mediaBlock(segments, block) {
      var qlist = new n.QueryList();
      var q = new n.Query();
      qlist.push(q);
      q.push(new n.Feature(segments));

      var media = u.setBlockPosition(new n.Media(qlist), block);
      media.block = block;

      return media;
    }


    function mbreakpoint(bp, ao) {
      if(typeof bp == 'undefined') return new n.Unit(0, '');

      if(bp.nodeName == 'string' || bp.nodeName == 'ident') {
        bp = Breakpoints[bp.string];
      }

      if(Config['anti-overlap'] && bp.val > 0 && ao) {
        bp = this.functions['to-px'](bp);
        bp.val -= 1;
      }

      if(Config.em) {
        bp = this.functions['to-em'](bp);
      }

      return bp;
    }


    function medges(map) {
      var dw = map.dw ? map.dw.nodes[0].val : map['use-device-width'] ?
          map['use-device-width'].val : Config['use-device-width'];

      var query = [];
      var sizes = [
          mbreakpoint.call(this, map.from),
          mbreakpoint.call(this, map.to, true),
        ];
      var dwc = dw ? 'device-' : '';
      templates = ['(min-' + dwc + 'width: %s)', '(max-' + dwc + 'width: %s)'];

      for(var i = sizes.length - 1; i >= 0; i--) {
        if(sizes[i].val > 0) {
          query.push(nu.format(templates[i], sizes[i].toString()));
        }
      }

      return query.join(' and ');
    }


    function morientation(o) {
      o = o.nodes[0];
      return '(orientation: ' + o.toString() + ')';
    }


    function mdensity(d) {
      var dpi = getVar(this, 'DPI');
      dpi = dpi ? dpi.val : 96;

      d = d.nodes[0];

      if(d.string == 'retina') {
        de = '' + Config['retina-density'];
        d.val = Config['retina-density'];
      } else {
        de = d.toString();
      }

      query = '' +
          '(-webkit-min-device-pixel-ratio: '+ de + ')' +
          ' and (min--moz-device-pixel-ratio: '+ de + ')' +
          ' and (-o-min-device-pixel-ratio: '+ de + '/1)' +
          ' and (min-device-pixel-ratio: '+ de + ')' +
          ' and (min-resolution: '+ Math.round(d.val * dpi, 1) + 'dpi)';

      return query
    }


    function mquery(map) {
      var query = 'only screen';
      var edges = medges.call(this, map);
      query += edges ? ' and ' + edges : '';
      var o = map.orientation ? map.orientation : map.o ? map.o : false;
      var d = map.density ? map.density : map.d ? map.d : false;

      if(o) {
        query += ' and ' + morientation.call(this, o);
      }

      if(d) {
        query += ' and ' + mdensity.call(this, d);
      }

      return query;
    }


    function media(map) {
      var parent = this.currentBlock,
          call = parent.nodes[parent.index],
          block = call.block;

      var media = mediaBlock([new n.Literal(mquery.call(this, call.args.map))], block);

      var bl = u.setBlockPosition(new n.Block(block.parent, media), block);
      bl.push(media);

      return bl;
    };


    // Mixins

    var to = function(to) {
      var parent = this.currentBlock,
          call = parent.nodes[parent.index];
      call.args.map.to = to;

      return media.call(this, call.args.map);
    };

    var from = function(from) {
      var parent = this.currentBlock,
          call = parent.nodes[parent.index];
      call.args.map.from = from;

      return media.call(this, call.args.map);
    };

    var between = function(from, to) {
      var parent = this.currentBlock,
          call = parent.nodes[parent.index];

      call.args.map.from = from;
      call.args.map.to = to;

      return media.call(this, call.args.map);
    };


    // Define

    style.define('responsive-config', function(hash) {
      hash = u.hashToObject(hash);

      for(var i in hash) {
        if(!hash.hasOwnProperty(i)) continue;

        if(typeof Config[i] != 'undefined') {
          Config[i] = hash[i].val ? hash[i].val : hash[i].string;
        }
      }
    });


    style.define('responsive-breakpoints', function(hash) {
      hash = u.hashToObject(hash);

      for(var i in hash) {
        if(!hash.hasOwnProperty(i)) continue;

        Breakpoints[i] = hash[i];
      }
    });


    style.define('to', to);
    style.define('below', to);
    style.define('from', from);
    style.define('above', from);
    style.define('between', between);
  };
};

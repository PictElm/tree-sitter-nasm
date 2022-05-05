/// <reference path="node_modules/tree-sitter-cli/dsl.d.ts" />
module.exports = grammar({

  name: 'nasm',

  extras: $ => [
    $.comment,
    /\s|\\\r?\n/,
  ],

  conflicts: $ => [
    [$.label, $.unknown_instruction],
    [$.operand, $.expression], // XXX: not sure, which way should it be?
  ],

  rules: {

    // source_file ::= {[source|preproc|assembl] '\n'} [source|preproc|assembl]
    source_file: $ => seq(
      repeat(
        seq(
          optional(choice(
            $.source_line,
            $.preproc_directive,
            $.assembl_directive,
          )),
          /\r?\n/,
        ),
      ),
      optional(choice(
        $.source_line,
        $.preproc_directive,
        $.assembl_directive,
      )),
    ),

    // source_line ::= [label[':']] [prefix] [instr [opr{',' opr}]] '\n'
    source_line: $ => choice(
      $.label,
      $.instruction,
      seq($.label, $.instruction),
    ),

    // XXX: question: can you have a macro over multiple files?
    preproc_directive: $ => seq('%', choice( // XXX: %+ %? %?? %!<env> %, %%<label> %{..} %0 %n %00 %[..] .....
      'define', 'idefine', 'xdefine', // <ident> immediat!['(' [('='|'&'|'+'|'!')<name> {',' (...)<name>} [',']] ')'] <value>
      'undef', // <name>
      'assign', 'iassign', // similar to the define family
      'defstr', 'idefstr', // 
      'deftok', 'ideftok', // 
      'defalias', 'idefalias', 'undefalias', 'clear', 'aliases', 'ifdefalias',
      'strcat', 'strlen', 'substr',
      'macro', 'imacro', 'endmacro', 'unmacro',
      'rotate',
      'if', 'ifn', 'elif', 'elifn', 'else', 'endif', // .. and variants 'ifdef', 'ifmacro', 'ifctx', 'ifidn', 'ifidni', 'ifid', 'ifnum', 'ifstr', 'iftoken', 'ifempty', 'ifenv'
      'rep', 'endrep',
      'include',
      'pathsearch',
      'depend',
      'use',
      'push', 'pop',
      'repl',
      'arg', 'stacksize', 'local',
      'error', 'warning', 'fatal',
      'pragma', // 'ignore', 'preproc', 'limit', 'asm', 'list', 'file', 'input', 'output', 'debug', but also << output or debug format, and sometimes groups thereof >>
      'line',
      'clear', // [global|context] type ('define', 'defalias', 'alldefine', 'macro', 'all')
    )),

    assembl_directive: $ => choice(
      'bits', /* <number> */ 'use16', 'use32',
      'default', // REL | ABS | BND | NOBND
      'section', 'segment', // <dotted_name?>
      'absolute', // <number>
      'extern', 'required', 'global', 'static', // <ident> (depends)
      'common', // <ident> <number>
      'prefix', 'gprefix', 'lprefix',
      'postfix', 'gpostfix', 'lpostfix',
      'cpu', // <cpu_ident>
      'float', // DAZ | NODAZ | NEAR | UP | DOWN | ZERO | DEFAULT
      'warning', // 'no', 'user', 'form',
    ),

    label: $ => prec(5, seq($.word, optional(':'))), // precedence over unknown_operation

    instruction: $ => seq(
      optional($.instruction_prefix),
      choice(
        $.known_instruction,
        $.pseudo_instruction,
        $.unknown_instruction,
      ),
      optional($.operands),
    ),
    instruction_prefix: $ => choice(...[
      'LOCK', 'REP', 'REPE', 'REPZ', 'REPNE', 'REPNZ', 'XACQUIRE', 'XRELEASE', 'BND', 'NOBND',
      /*_address_size:*/ 'A16', 'A32', 'A64',
      /*_operand_size:*/ 'O16', 'O32', 'O64',
      /*_segment_register:*/ 'CS', 'DS', 'SS', 'ES', 'FS', 'GS',
    ].map(ci)),
    known_instruction: $ => choice(...['MOV', 'ADD', 'INC', 'SYSCALL', 'SCASB', 'INT'].map(ci)), // XXX: incomplete
    pseudo_instruction: $ => choice(...[
      'DB', 'DW', 'DD', 'DQ', 'DT', 'DO', 'DY', 'DZ',
      'RESB', 'RESW', 'RESD', 'RESQ', 'REST', 'RESO', 'RESY', 'RESZ',
      'INCBIN', // XXX: not exactly syntax, but expects filename [offset [count]]
      'EQU', // XXX: technically requires a label before it
      'TIMES', // XXX/FIXME: expects TIMES <numeric_expression> <instruction> (NOTE: kinda like a prefix, no?)
    ].map(ci)),
    unknown_instruction: $ => $.word,

    operands: $ => seq($.operand, repeat(seq(',', $.operand))),
    operand: $ => seq(
      optional($.operand_prefix),
      choice(
        $.register,
        $.effective_address,
        $.constant,
        $.expression,
      ),
    ),
    operand_prefix: $ => seq(
      optional(ci('STRICT')),
      choice(...['BYTE', 'WORD', 'DWORD', 'QWORD', 'TWORD', 'OWORD', 'YWORD', 'ZWORD'].map(ci)),
    ),

    register: $ => choice(...[
      'AL', 'AH', 'CL', 'CH', 'DL', 'DH', 'BL', 'BH', 'SPL', 'BPL', 'SIL', 'DIL', 'R8B', 'R9B', 'R10B', 'R11B', 'R12B', 'R13B', 'R14B', 'R15B',
      'AX', 'CX', 'DX', 'BX', 'SP', 'BP', 'SI', 'DI', 'R8W', 'R9W', 'R10W', 'R11W', 'R12W', 'R13W', 'R14W', 'R15W',
      'EAX', 'ECX', 'EDX', 'EBX', 'ESP', 'EBP', 'ESI', 'EDI', 'R8D', 'R9D', 'R10D', 'R11D', 'R12D', 'R13D', 'R14D', 'R15D',
      'RAX', 'RCX', 'RDX', 'RBX', 'RSP', 'RBP', 'RSI', 'RDI', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15',
    ].map(ci)),

    effective_address: $ => seq(
      '[',
      optional(choice(...['BYTE', 'WORD', 'DWORD', 'NOSPLIT', 'REL', 'ABS'].map(ci))),
      $.expression,
      ']',
    ),

    constant: $ => choice(
      $.constant_numeric, // XXX: no test
      $.constant_charstr, // XXX: no test
      //$.constant_floatpt, // XXX: not everywhere
    ),

    // YYY: some things could be simplified if eg. _4506 or $A540 are words out of precedence
    // @see NASM numeric constants are confusing:
    //      https://github.dev/netwide-assembler/nasm/blob/3f9fc2a3a7134936cbbae5780beb4319694f702a/asm/stdscan.c#L192
    constant_numeric: $ => {
      /**
       * the same characters can be used in prefix or suffix notation:
       *  - 0xFF
       *  - FFx
       *  - eax   that's a register!
       * 
       * '_'s can be used almost anywhere:
       *  - 0x_FF
       *  - FF_x
       *  - _FFx  is not a number but a word!
       *  - $FF   also a word!
       *  - $_FF  same!
       * 
       * when dubious, precedence is probably along:
       *  register > word > constant_numeric
       */
      function _make_num(fixes, digits) {
        return [
          RegExp(`0[${fixes}][${digits}_]*`), // yes, '*' and not '+'
          RegExp(`[${digits}][${digits}_]*[${fixes}]`),
        ];
      }
      return choice(
        /[0-9]+/,
        /\$[0-9][0-9A-Fa-f]*/,
        ..._make_num('HXhx', '0123456789ABCDEFabcdef'),
        ..._make_num('DTdt', '0123456789'),
        ..._make_num('OQoq', '01234567'),
        ..._make_num('BYby', '01'),
      );
    },
    constant_charstr: $ => choice(
      /'[^']*'/,
      /"[^"]*"/,
      /`(\\.|[^\\`])*`/,
      // YYY: it never complains about erroneous escapes..:
      //      << All other escape sequences are reserved. >>
      //      .. otherwise below may be more accurate
      /*seq(
        '`',
        repeat(choice(
          seq('\\', choice(
            /['"`\\?abtnvfre0]/,
            /\d{1,3}/, // octal up to 3
            /x[0-9A-Fa-f]{,2}/, // hexadecimal up to 2
            /u[0-9A-Fa-f]{4}/, // hexadecimal unicode 4
            /U[0-9A-Fa-f]{8}/, // hexadecimal unicode 8
          )),
          /[^`\\]/,
        )),
        '`',
      ),*/
    ),
    constant_floatpt: $ => {
      /**
       * has common points with parsing constant_numeric,
       * becomes a floating point when has dot or exponent
       * (and no suffix notation for obvious reasons)
       * 
       * XXX/FIXME/CLEANME or something
       * 
       * this is probably not always accurate with eg.:
       *  - 0xB1AB1Ae-0BA ; should be invalid
       *  - 0d1.5e ; should be valid
       * 
       * this first one can actually introduce quite the erroneous
       * parsing (constant_floatpt instead of a binary_expression)
       */
      function _make_flt(fixes, digits, expo, expd) {
        const frac = `\.[${digits}_]*([${expo}][-+]?[${expd}]+)?`;
        return [
          RegExp(`0[${fixes}][${digits}_]*${frac}`),
        ];
      }
      const O9 = '0123456789';
      const OF = O9+'ABCDEFabcdef';
      return choice(
        /[0-9]+\.[0-9]*([Ee][0-9]+)?/, // only e[0-9]
        /\$[0-9][0-9A-Fa-f]*\.[0-9]*([Ee][0-9A-Fa-f]+|[Pp][0-9]+)?/, // both e[0-F] and p[0-9]
        ..._make_flt('HXhx', OF, 'Ee', OF),
        ..._make_flt('HXhx', OF, 'Pp', O9),
        ..._make_flt('DTdt', O9, 'Ee', O9),
        ..._make_flt('OQoq', '01234567', 'Pp', O9),
        ..._make_flt('BYby', '01', 'Pp', O9),
      );
    },

    // NOTE/TODO: WRT as binary? : as binary?
    // XXX/TODO: $ and $$ are considered special tokens
    // TODO: preproc_expression accepting eg. %+
    expression: $ => choice(
      $.conditional_expression,
      $.binary_expression,
      $.unary_expression,
      $.parenthesized_expression,
      $.word, // ie. identifier
      $.constant,
    ),
    conditional_expression: $ => prec.right(1, seq( // YYY: right?
      $.expression, '?', $.expression, ':', $.expression,
    )),
    binary_expression: $ => {
      const ops = [
        ['||'],
        ['^^'],
        ['&&'],
        ['=', '==', '!=', '<>', '<', '<=', '>', '>=', '<=>'],
        ['|'],
        ['^'],
        ['&'],
        ['<<', '>>', '<<<', '>>>'],
        ['+', '-'],
        ['*', '/', '//', '%', '%%'],
      ];
      // no `flatMap`, use `reduce`
      return prec(2, choice(...ops.reduce((acc, ls, k) => acc.concat(
        ls.map(op =>
          prec.left(k, seq(
            $.expression, op, $.expression,
          )),
        ),
      ), []))); // [] is reduce's `initialValue`
    },
    unary_expression: $ => prec.left(3, seq(
      choice('-', '+', '~', '!', ci('SEG')), $.expression,
    )),
    parenthesized_expression: $ => seq(
      '(', $.expression, ')',
    ),

    comment: $ => /;(\\\r?\n|.)*/,
    // YYY: `@bidoof` sould not be valid as per the doc (same with `$@bidoof`)
    word: $ => prec(-5, /\$?[A-Za-z._?][A-Za-z0-9_$#@~.?]*/),

  },

});

/**
 * @param {string|RegExp} it
 * @see https://github.com/tree-sitter/tree-sitter/issues/261
 */
function ci(it) {
  const src = 'string' === typeof it
    ? it
    : it.source
    ;
  const pat = src
    .split('')
    .map(c => c.toUpperCase() === c.toLowerCase()
      ? c
      : `[${c.toLowerCase()}${c.toUpperCase()}]`
    )
    .join('')
    ;
  return RegExp(pat, (it.flags ?? '') + 'i');
}

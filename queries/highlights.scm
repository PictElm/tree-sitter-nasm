;;; Highlighting for NASM

(comment) @comment
;(ERROR) @error ; because of the nature of the 'language', the parser is not always right.. trust your instinct

(label) @label

[
  (preproc_expression)
  (line_here_token)
  (section_here_token)
] @variable.builtin
(preproc_expression
  "]" @variable.builtin)
(preproc_expression
  "}" @variable.builtin)

(unary_expression
  operator: _ @operator.unary)
(binary_expression
  operator: _ @operator.binary)
(conditional_expression
  "?" @operator
  ":" @operator)

[
  ":"
  ","
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

(instruction_prefix) @keyword
(actual_instruction
  instruction: (word) @function)

(call_syntax_expression
  base: (word) @function)

(size_hint) @type
(struc_declaration
  name: (word) @type)
(struc_instance
  name: (word) @type)

(effective_address
 hint: _ @type)
(effective_address
 segment: _ @constant.builtin)

(register) @constant.builtin

(number_literal) @number.integer
(string_literal) @string
(float_literal) @number.float
(packed_bcd_literal) @number.integer

((word) @constant
  (#match? @constant "^[A-Z_][?A-Z_0-9]+$"))
((word) @constant.builtin
  (#match? @constant.builtin "^__\\?[A-Z_a-z0-9]+\\?__$"))
(word) @variable

(preproc_arg) @keyword

[
  (preproc_def)
  (preproc_function_def)
  (preproc_undef)
  (preproc_alias)
  (preproc_multiline_macro)
  (preproc_multiline_unmacro)
  (preproc_if)
  (preproc_rotate)
  (preproc_rep_loop)
  (preproc_include)
  (preproc_pathsearch)
  (preproc_depend)
  (preproc_use)
  (preproc_push)
  (preproc_pop)
  (preproc_repl)
  (preproc_arg)
  (preproc_stacksize)
  (preproc_local)
  (preproc_reporting)
  (preproc_pragma)
  (preproc_line)
  (preproc_clear)
; .. maybe should only capture the first literal for this
; ('%bidoof' (also should be case insensitive))
] @keyword
[
  (pseudo_instruction_dx)
  (pseudo_instruction_resx)
  (pseudo_instruction_incbin_command)
  (pseudo_instruction_equ_command)
  (pseudo_instruction_times_prefix)
  (pseudo_instruction_alignx_macro)
; same here
] @keyword
[
  (assembl_directive_target)
  (assembl_directive_defaults)
  (assembl_directive_sections)
  (assembl_directive_absolute)
  (assembl_directive_symbols)
  (assembl_directive_common)
  (assembl_directive_symbolfixes)
  (assembl_directive_cpu)
  (assembl_directive_floathandling)
  (assembl_directive_org)
  (assembl_directive_sectalign)

  (assembl_directive_primitive_target)
  (assembl_directive_primitive_defaults)
  (assembl_directive_primitive_sections)
  (assembl_directive_primitive_absolute)
  (assembl_directive_primitive_symbols)
  (assembl_directive_primitive_common)
  (assembl_directive_primitive_symbolfixes)
  (assembl_directive_primitive_cpu)
  (assembl_directive_primitive_floathandling)
  (assembl_directive_primitive_org)
  (assembl_directive_primitive_sectalign)
  (assembl_directive_primitive_warning)
  (assembl_directive_primitive_map)
; and same, again, but for the primitive only capture
; the second literal (skip the '[')
] @keyword

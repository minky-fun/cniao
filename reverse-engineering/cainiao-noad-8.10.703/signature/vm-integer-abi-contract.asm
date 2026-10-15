; Verified primitive type selection, VM sources, integer ABI packing and return extension.
; These intervals contain instructions; omitted obfuscation data and other type paths remain unimplemented.
0x102a4cfc0 adrp x16, #0x10481f000
0x102a4cfc4 add x16, x16, #0x7b8
0x102a4cfc8 adrp x17, #0x10481f000
0x102a4cfcc add x17, x17, #0x7a0
0x102a4cfd0 adrp x0, #0x10481f000
0x102a4cfd4 add x0, x0, #0x7e8
0x102a4cfd8 adrp x1, #0x10481f000
0x102a4cfdc add x1, x1, #0x7d0
0x102a4cfe0 adrp x2, #0x10481f000
0x102a4cfe4 add x2, x2, #0x818
0x102a4cfe8 adrp x3, #0x10481f000
0x102a4cfec add x3, x3, #0x800
0x102a4cff0 adrp x4, #0x10481f000
0x102a4cff4 add x4, x4, #0x848
0x102a4cff8 adrp x5, #0x10481f000
0x102a4cffc add x5, x5, #0x830
0x102a4d000 adrp x6, #0x10481f000
0x102a4d004 add x6, x6, #0x860
0x102a4d008 adrp x7, #0x10481f000
0x102a4d00c add x7, x7, #0x878
0x102a4d010 movi v0.16b, #0
0x102a4d014 add x26, sp, #0x10
0x102a4d018 adrp x27, #0x10481f000
0x102a4d01c add x27, x27, #0x890
0x102a4d020 ldrsw x10, [x24]
0x102a4d024 cmp w10, w23
0x102a4d028 b.ge #0x102a4d3c4
0x102a4d02c ldr x9, [x20]
0x102a4d030 add x11, x9, #1
0x102a4d034 str x11, [x20]
0x102a4d038 cbz x9, #0x102a4d394
0x102a4d03c ldrb w11, [x9]
0x102a4d040 cmp x11, #0x7d
0x102a4d044 b.hi #0x102a4d394
0x102a4d048 ldr w11, [x28, x11, lsl #2]
0x102a4d04c cmp w11, #0x18
0x102a4d050 b.hi #0x102a4d394
0x102a4d054 adr x12, #0x102a4d064
0x102a4d058 ldrb w13, [x14, x11]
0x102a4d05c add x12, x12, x13, lsl #2
0x102a4d060 br x12
0x102a4d064 mov w9, #0
0x102a4d068 add w11, w10, #1
0x102a4d06c str w11, [x24]
0x102a4d070 str x27, [x25, x10, lsl #3]
0x102a4d074 b #0x102a4d150
0x102a4d078 mov w9, #0
0x102a4d07c add w11, w10, #1
0x102a4d080 str w11, [x24]
0x102a4d084 str x15, [x25, x10, lsl #3]
0x102a4d088 b #0x102a4d150
0x102a4d08c mov w9, #0
0x102a4d090 add w11, w10, #1
0x102a4d094 str w11, [x24]
0x102a4d098 str x16, [x25, x10, lsl #3]
0x102a4d09c b #0x102a4d150
0x102a4d0a0 mov w9, #0
0x102a4d0a4 add w11, w10, #1
0x102a4d0a8 str w11, [x24]
0x102a4d0ac str x17, [x25, x10, lsl #3]
0x102a4d0b0 b #0x102a4d150
0x102a4d0b4 mov w9, #0
0x102a4d0b8 add w11, w10, #1
0x102a4d0bc str w11, [x24]
0x102a4d0c0 str x0, [x25, x10, lsl #3]
0x102a4d0c4 b #0x102a4d150
0x102a4d0c8 mov w9, #0
0x102a4d0cc add w11, w10, #1
0x102a4d0d0 str w11, [x24]
0x102a4d0d4 str x1, [x25, x10, lsl #3]
0x102a4d0d8 b #0x102a4d150
0x102a4d0dc mov w9, #0
0x102a4d0e0 add w11, w10, #1
0x102a4d0e4 str w11, [x24]
0x102a4d0e8 str x2, [x25, x10, lsl #3]
0x102a4d0ec b #0x102a4d150
0x102a4d0f0 mov w9, #0
0x102a4d0f4 add w11, w10, #1
0x102a4d0f8 str w11, [x24]
0x102a4d0fc str x3, [x25, x10, lsl #3]
0x102a4d100 b #0x102a4d150
0x102a4d104 mov w9, #0
0x102a4d108 add w11, w10, #1
0x102a4d10c str w11, [x24]
0x102a4d110 str x4, [x25, x10, lsl #3]
0x102a4d114 b #0x102a4d150
0x102a4d118 mov w9, #0
0x102a4d11c add w11, w10, #1
0x102a4d120 str w11, [x24]
0x102a4d124 str x5, [x25, x10, lsl #3]
0x102a4d128 b #0x102a4d150
0x102a4d12c mov w9, #0
0x102a4d130 add w11, w10, #1
0x102a4d134 str w11, [x24]
0x102a4d138 str x6, [x25, x10, lsl #3]
0x102a4d13c b #0x102a4d150
0x102a4d140 mov w9, #0
0x102a4d144 add w11, w10, #1
0x102a4d148 str w11, [x24]
0x102a4d14c str x7, [x25, x10, lsl #3]
0x102a4d528 ldr x24, [x21, x25]
0x102a4d52c ldrh w8, [x24, #0xa]
0x102a4d530 sub w9, w8, #5
0x102a4d534 cmp w9, #9
0x102a4d538 b.hi #0x102a4d558
0x102a4d53c cmp x26, #0xc
0x102a4d540 b.lo #0x102a4d590
0x102a4d544 ldr x8, [x23, #0xa8]
0x102a4d548 add w10, w25, #0x80
0x102a4d54c and x10, x10, #0xfffffff8
0x102a4d550 add x22, x8, x10
0x102a4d554 b #0x102a4d598
0x102a4d558 and w9, w8, #0xfffe
0x102a4d55c cmp w9, #2
0x102a4d560 b.ne #0x102a4d668
0x102a4d564 cmp w19, #1
0x102a4d568 b.lt #0x102a4d5b8
0x102a4d56c cmp w27, w19
0x102a4d570 b.lt #0x102a4d5b8
0x102a4d574 cmp x26, #0xc
0x102a4d578 b.lo #0x102a4d5dc
0x102a4d57c ldr x9, [x23, #0xa8]
0x102a4d580 add w10, w25, #0x80
0x102a4d584 and x10, x10, #0xfffffff8
0x102a4d588 add x9, x9, x10
0x102a4d58c b #0x102a4d5e4
0x102a4d590 add x8, x23, x25
0x102a4d594 add x22, x8, #0x78
0x102a4d598 cmp w9, #9
0x102a4d59c b.hi #0x102a4d684
0x102a4d5a0 adr x8, #0x102a4d5b0
0x102a4d5a4 ldrb w10, [x11, x9]
0x102a4d5a8 add x8, x8, x10, lsl #2
0x102a4d5ac br x8
0x102a4d5b0 str x22, [x20, x25]
0x102a4d5b4 b #0x102a4d668
0x102a4d5b8 cmp x26, #0x1e
0x102a4d5bc b.hs #0x102a4d5fc
0x102a4d5c0 cmp w8, #3
0x102a4d5c4 b.eq #0x102a4d65c
0x102a4d5c8 cmp w8, #2
0x102a4d5cc b.ne #0x102a4d684
0x102a4d5d0 add x8, x23, x25
0x102a4d5d4 add x8, x8, #0x13c
0x102a4d5d8 b #0x102a4d664
0x102a4d5dc add x9, x23, x25
0x102a4d5e0 add x9, x9, #0x78
0x102a4d5e4 cmp w8, #3
0x102a4d5e8 b.eq #0x102a4d5f4
0x102a4d5ec cmp w8, #2
0x102a4d5f0 b.ne #0x102a4d684
0x102a4d5f4 str x9, [x20, x25]
0x102a4d5f8 b #0x102a4d668
0x102a4d5fc ldr x8, [x23, #0xa8]
0x102a4d600 add w9, w25, #0x80
0x102a4d604 and x9, x9, #0xfffffff8
0x102a4d608 add x8, x8, x9
0x102a4d60c b #0x102a4d664
0x102a4d610 ldr x8, [x24]
0x102a4d614 cbnz x8, #0x102a4d64c
0x102a4d618 ldr w8, [x1, #0x20]
0x102a4d61c sub w8, w8, #1
0x102a4d620 cmp w8, #1
0x102a4d624 b.hi #0x102a4d684
0x102a4d628 str x1, [sp, #8]
0x102a4d62c mov x0, x24
0x102a4d630 mov x1, #0
0x102a4d634 bl #0x102a638a4
0x102a4d638 cbnz w0, #0x102a4d684
0x102a4d63c ldr x8, [x24]
0x102a4d640 ldr x1, [sp, #8]
0x102a4d644 adrp x11, #0x10481f000
0x102a4d648 add x11, x11, #0x204
0x102a4d64c cmp x8, #0x11
0x102a4d650 b.lo #0x102a4d5b0
0x102a4d654 ldr x8, [x22]
0x102a4d658 b #0x102a4d664
0x102a4d65c add x8, x23, x25
0x102a4d660 add x8, x8, #0x138
0x102a4d664 str x8, [x20, x25]
0x102a4d668 add w27, w27, #1
0x102a4d66c add x26, x26, #2
0x102a4d670 add x25, x25, #8
0x102a4d674 cmp x28, x25
0x102a4d678 b.ne #0x102a4d528
0x102a4d67c mov w0, #0
0x102a4d680 b #0x102a4d688
0x102a4d684 mov w0, #0x1f
0x102a4d688 ldp x29, x30, [sp, #0x60]
0x102a4d68c ldp x20, x19, [sp, #0x50]
0x102a4d690 ldp x22, x21, [sp, #0x40]
0x102a4d694 ldp x24, x23, [sp, #0x30]
0x102a4d698 ldp x26, x25, [sp, #0x20]
0x102a4d69c ldp x28, x27, [sp, #0x10]
0x102a4d6a0 add sp, sp, #0x70
0x102a4d6a4 ret
0x102a5a2e4 ldrsh x8, [x28]
0x102a5a2e8 b #0x102a5a308
0x102a5a2ec ldrb w8, [x28]
0x102a5a2f0 b #0x102a5a308
0x102a5a2f4 ldrsb x8, [x28]
0x102a5a2f8 b #0x102a5a308
0x102a5a2fc ldr w8, [x28]
0x102a5a300 b #0x102a5a308
0x102a5a304 ldrh w8, [x28]
0x102a5a308 cmp w24, #7
0x102a5a30c b.hi #0x102a5a320
0x102a5a310 ldur x9, [x29, #-0x70]
0x102a5a314 str x8, [x9, w24, uxtw #3]
0x102a5a318 add w24, w24, #1
0x102a5a31c b #0x102a5a3dc
0x102a5a320 ldrh w8, [x20, #8]
0x102a5a324 ldur x9, [x29, #-0x60]
0x102a5a328 sub x9, x9, #1
0x102a5a32c sub x10, x8, #1
0x102a5a330 cmp x8, #8
0x102a5a334 ccmp w26, #0, #4, lo
0x102a5a338 mov w8, #7
0x102a5a33c csel x8, x8, x10, ne
0x102a5a340 orr x8, x8, x9
0x102a5a344 add x8, x8, #1
0x102a5a348 add x9, x8, x21
0x102a5a34c stur x9, [x29, #-0x60]
0x102a5a350 ldur x9, [x29, #-0x68]
0x102a5a354 add x0, x9, x8
0x102a5a358 mov x1, x28
0x102a5a35c mov x2, x21
0x102a5a360 bl #0x104431448
0x102a5a3dc add x19, x19, #1
0x102a5a3e0 ldr w8, [x23, #0x20]
0x102a5a3e4 cmp x19, x8
0x102a5a3e8 mov w8, #8
0x102a5a3ec csel w25, w8, w25, eq
0x102a5a3f0 csinc w26, w26, wzr, ne
0x102a5a3f4 csel w24, w8, w24, eq
0x102a5a3f8 add x22, x22, #8
0x102a5a3fc cmp x27, x19
0x102a5a400 b.ne #0x102a5a084
0x102a26ad0 uxtb w0, w0
0x102a26ad4 str x0, [x3]
0x102a26ad8 b #0x102a26b30
0x102a26adc nop
0x102a26ae0 uxth w0, w0
0x102a26ae4 str x0, [x3]
0x102a26ae8 b #0x102a26b30
0x102a26aec nop
0x102a26af0 mov w0, w0
0x102a26af4 str x0, [x3]
0x102a26af8 b #0x102a26b30
0x102a26afc nop
0x102a26b00 sxtb x0, w0
0x102a26b04 str x0, [x3]
0x102a26b08 b #0x102a26b30
0x102a26b0c nop
0x102a26b10 sxth x0, w0
0x102a26b14 str x0, [x3]
0x102a26b18 b #0x102a26b30
0x102a26b1c nop
0x102a26b20 sxtw x0, w0
0x102a26b24 str x0, [x3]
0x102a26b28 b #0x102a26b30
0x102a26b2c nop
0x102a26b30 ret
0x102a54b64 mov x8, x6
0x102a54b68 sxtw x6, w0
0x102a54b6c mov x0, x1
0x102a54b70 mov x1, x2
0x102a54b74 mov x2, x3
0x102a54b78 mov x3, x4
0x102a54b7c mov x4, x5
0x102a54b80 mov x5, x8
0x102a54b84 b #0x102a2f3e4

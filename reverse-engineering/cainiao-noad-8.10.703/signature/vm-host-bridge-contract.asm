; Selected instructions for the public common-function lookup and command-dispatch bridges.
; Omitted intervals contain jumped-over obfuscation data; table contents remain runtime state.
0x102a8e9a0 sub sp, sp, #0x20
0x102a8e9a4 stp x26, x25, [sp, #0x10]
0x102a8e9a8 mov w8, #0x68
0x102a8e9ac str w8, [sp, #8]
0x102a8e9b0 add x8, sp, #0xc
0x102a8e9b4 add x9, sp, #8
0x102a8e9b8 adr x7, #0x102a8e9bc
0x102a8e9bc ldrsw x26, #0x102a8e9e4
0x102a8e9c0 mvn x26, x26
0x102a8e9c4 mvn x26, x26
0x102a8e9c8 add x26, x26, #0xae
0x102a8e9cc ldrsw x5, [x9]
0x102a8e9d0 add x26, x26, x5
0x102a8e9d4 add x7, x7, x26
0x102a8e9d8 mov w16, #7
0x102a8e9dc str w16, [x8]
0x102a8e9e0 br x7
0x102a8e9fc ldp x26, x25, [sp, #0x10]
0x102a8ea00 add sp, sp, #0x20
0x102a8ea04 b #0x102a9271c
0x102a8ea08 sub sp, sp, #0x40
0x102a8ea0c stp x28, x27, [sp, #0x10]
0x102a8ea10 stp x24, x23, [sp, #0x20]
0x102a8ea14 stp x22, x21, [sp, #0x30]
0x102a8ea18 mov w8, #0x7e
0x102a8ea1c str w8, [sp, #8]
0x102a8ea20 add x8, sp, #8
0x102a8ea24 adr x21, #0x102a8ea28
0x102a8ea28 ldrsw x17, #0x102a8ea40
0x102a8ea2c ldrsw x23, [x8]
0x102a8ea30 add x17, x17, x23
0x102a8ea34 add x21, x21, x17
0x102a8ea38 mov x8, #0x74
0x102a8ea3c br x21
0x102a8ea54 mov w8, #0xe2
0x102a8ea58 str w8, [sp, #0xc]
0x102a8ea5c add x8, sp, #0xc
0x102a8ea60 adr x28, #0x102a8ea64
0x102a8ea64 ldrsw x6, #0x102a8ea84
0x102a8ea68 mov x2, #0x82
0x102a8ea6c eor x6, x6, x2
0x102a8ea70 ldrsw x5, [x8]
0x102a8ea74 add x6, x6, x5
0x102a8ea78 add x28, x28, x6
0x102a8ea7c mov x8, #0x23
0x102a8ea80 br x28
0x102a8ea98 adrp x8, #0x105531000
0x102a8ea9c add x8, x8, #0x300
0x102a8eaa0 ldr x0, [x8, w0, uxtw #3]
0x102a8eaa4 ldp x22, x21, [sp, #0x30]
0x102a8eaa8 ldp x24, x23, [sp, #0x20]
0x102a8eaac ldp x28, x27, [sp, #0x10]
0x102a8eab0 add sp, sp, #0x40
0x102a8eab4 ret
0x102a9271c sub sp, sp, #0x30
0x102a92720 stp x28, x27, [sp, #0x10]
0x102a92724 stp x26, x25, [sp, #0x20]
0x102a92728 mov x8, x1
0x102a9272c mov w9, #0x50
0x102a92730 str w9, [sp, #4]
0x102a92734 add x9, sp, #8
0x102a92738 add x10, sp, #4
0x102a9273c adr x7, #0x102a92740
0x102a92740 ldrsw x26, #0x102a92768
0x102a92744 mvn x26, x26
0x102a92748 mvn x26, x26
0x102a9274c add x26, x26, #0xae
0x102a92750 ldrsw x5, [x10]
0x102a92754 add x26, x26, x5
0x102a92758 add x7, x7, x26
0x102a9275c mov w16, #7
0x102a92760 str w16, [x9]
0x102a92764 br x7
0x102a9277c cbz x0, #0x102a927fc
0x102a92780 ldp x9, x1, [x0]
0x102a92784 ldr x2, [x0, #0x10]
0x102a92788 orr w10, w1, w9
0x102a9278c orr w10, w10, w2
0x102a92790 tbnz w10, #0x1f, #0x102a927fc
0x102a92794 ldr x4, [x0, #0x20]
0x102a92798 ldr w3, [x0, #0x18]
0x102a9279c mov w10, #0xa5
0x102a927a0 str w10, [sp, #0xc]
0x102a927a4 add x10, sp, #0xc
0x102a927a8 adr x5, #0x102a927ac
0x102a927ac ldrsw x13, #0x102a927c4
0x102a927b0 ldrsw x27, [x10]
0x102a927b4 sub x13, x13, x27
0x102a927b8 add x5, x5, x13
0x102a927bc mov x10, #0x9f
0x102a927c0 br x5
0x102a927d8 adrp x10, #0x1068f5000
0x102a927dc ldr x10, [x10, #0xe40]
0x102a927e0 ldr x6, [x10, #0x10]
0x102a927e4 mov x0, x9
0x102a927e8 mov x5, x8
0x102a927ec ldp x26, x25, [sp, #0x20]
0x102a927f0 ldp x28, x27, [sp, #0x10]
0x102a927f4 add sp, sp, #0x30
0x102a927f8 br x6
0x102a927fc cbz x8, #0x102a92808
0x102a92800 mov w9, #1
0x102a92804 str w9, [x8]
0x102a92808 mov x0, #0
0x102a9280c ldp x26, x25, [sp, #0x20]
0x102a92810 ldp x28, x27, [sp, #0x10]
0x102a92814 add sp, sp, #0x30
0x102a92818 ret

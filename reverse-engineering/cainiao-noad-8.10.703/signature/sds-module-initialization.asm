
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ab5a28: d10203ff    	sub	sp, sp, #0x80
102ab5a2c: a9046ffc    	stp	x28, x27, [sp, #0x40]
102ab5a30: a90557f6    	stp	x22, x21, [sp, #0x50]
102ab5a34: a9064ff4    	stp	x20, x19, [sp, #0x60]
102ab5a38: a9077bfd    	stp	x29, x30, [sp, #0x70]
102ab5a3c: 9101c3fd    	add	x29, sp, #0x70
102ab5a40: aa0003f3    	mov	x19, x0
102ab5a44: d0014828    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab5a48: f9438d08    	ldr	x8, [x8, #0x718]
102ab5a4c: f9400108    	ldr	x8, [x8]
102ab5a50: f9001fe8    	str	x8, [sp, #0x38]
102ab5a54: 52800dc8    	mov	w8, #0x6e               ; =110
102ab5a58: b90003e8    	str	w8, [sp]
102ab5a5c: 910003e8    	mov	x8, sp
102ab5a60: 1000002e    	adr	x14, 0x102ab5a64 <_CMa03SUie28mjv+0x5062c>
102ab5a64: 98000116    	ldrsw	x22, 0x102ab5a84 <_CMa03SUie28mjv+0x5064c>
102ab5a68: 9102bad6    	add	x22, x22, #0xae
102ab5a6c: aa3603f6    	mvn	x22, x22
102ab5a70: b9800100    	ldrsw	x0, [x8]
102ab5a74: 8b0002d6    	add	x22, x22, x0
102ab5a78: 8b1601ce    	add	x14, x14, x22
102ab5a7c: d2800ac8    	mov	x8, #0x56               ; =86
102ab5a80: d61f01c0    	br	x14
102ab5a84: ffffff87    	<unknown>
102ab5a88: 1fba7343    	<unknown>
102ab5a8c: 91219d05    	add	x5, x8, #0x867
102ab5a90: 2cc15602    	ldp	s2, s21, [x16], #0x8
102ab5a94: e4ff7fbd    	<unknown>
102ab5a98: 412089e8    	<unknown>
102ab5a9c: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5aa0: 39535e89    	ldrb	w9, [x20, #0x4d7]
102ab5aa4: 7101751f    	cmp	w8, #0x5d
102ab5aa8: 7a401924    	ccmp	w9, #0x0, #0x4, ne
102ab5aac: 540001a1    	b.ne	0x102ab5ae0 <_CMa03SUie28mjv+0x506a8>
102ab5ab0: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5ab4: 91136000    	add	x0, x0, #0x4d8
102ab5ab8: f000eb42    	adrp	x2, 0x104820000 <dyld_stub_binder+0x104820000>
102ab5abc: 913e6042    	add	x2, x2, #0xf98
102ab5ac0: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab5ac4: 91266063    	add	x3, x3, #0x998
102ab5ac8: 52800101    	mov	w1, #0x8                ; =8
102ab5acc: 52800084    	mov	w4, #0x4                ; =4
102ab5ad0: 52800f25    	mov	w5, #0x79               ; =121
102ab5ad4: 9465e0bf    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab5ad8: 52800028    	mov	w8, #0x1                ; =1
102ab5adc: 39135e88    	strb	w8, [x20, #0x4d7]
102ab5ae0: 528014b4    	mov	w20, #0xa5              ; =165
102ab5ae4: b9000ff4    	str	w20, [sp, #0xc]
102ab5ae8: 910033e8    	add	x8, sp, #0xc
102ab5aec: 10000025    	adr	x5, 0x102ab5af0 <_CMa03SUie28mjv+0x506b8>
102ab5af0: 980000cd    	ldrsw	x13, 0x102ab5b08 <_CMa03SUie28mjv+0x506d0>
102ab5af4: b980011b    	ldrsw	x27, [x8]
102ab5af8: cb1b01ad    	sub	x13, x13, x27
102ab5afc: 8b0d00a5    	add	x5, x5, x13
102ab5b00: d28013e8    	mov	x8, #0x9f               ; =159
102ab5b04: d61f00a0    	br	x5
102ab5b08: 000000d1    	udf	#0xd1
102ab5b0c: 2be47d30    	<unknown>
102ab5b10: 78a0fc92    	<unknown>
102ab5b14: 079a712b    	<unknown>
102ab5b18: 028972d1    	<unknown>
102ab5b1c: 9001f215    	adrp	x21, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102ab5b20: f94722a8    	ldr	x8, [x21, #0xe40]
102ab5b24: f9400108    	ldr	x8, [x8]
102ab5b28: 10dcc464    	adr	x4, 0x102a6f3b4 <_CMa03SUie28mjv+0x9f7c>
102ab5b2c: d503201f    	nop
102ab5b30: 52800020    	mov	w0, #0x1                ; =1
102ab5b34: 528000c1    	mov	w1, #0x6                ; =6
102ab5b38: 52800642    	mov	w2, #0x32               ; =50
102ab5b3c: 52800003    	mov	w3, #0x0                ; =0
102ab5b40: d63f0100    	blr	x8
102ab5b44: b9000ff4    	str	w20, [sp, #0xc]
102ab5b48: 910033e8    	add	x8, sp, #0xc
102ab5b4c: 10000025    	adr	x5, 0x102ab5b50 <_CMa03SUie28mjv+0x50718>
102ab5b50: 980000cd    	ldrsw	x13, 0x102ab5b68 <_CMa03SUie28mjv+0x50730>
102ab5b54: b980011b    	ldrsw	x27, [x8]
102ab5b58: cb1b01ad    	sub	x13, x13, x27
102ab5b5c: 8b0d00a5    	add	x5, x5, x13
102ab5b60: d28013e8    	mov	x8, #0x9f               ; =159
102ab5b64: d61f00a0    	br	x5
102ab5b68: 000000d1    	udf	#0xd1
102ab5b6c: 2be47d30    	<unknown>
102ab5b70: 78a0fc92    	<unknown>
102ab5b74: 079a712b    	<unknown>
102ab5b78: 028972d1    	<unknown>
102ab5b7c: f94722a8    	ldr	x8, [x21, #0xe40]
102ab5b80: f9400108    	ldr	x8, [x8]
102ab5b84: 10000924    	adr	x4, 0x102ab5ca8 <_CMa03SUie28mjv+0x50870>
102ab5b88: d503201f    	nop
102ab5b8c: 52800020    	mov	w0, #0x1                ; =1
102ab5b90: 528000c1    	mov	w1, #0x6                ; =6
102ab5b94: 528006c2    	mov	w2, #0x36               ; =54
102ab5b98: 52800003    	mov	w3, #0x0                ; =0
102ab5b9c: d63f0100    	blr	x8
102ab5ba0: b9000bff    	str	wzr, [sp, #0x8]
102ab5ba4: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab5ba8: 9123e108    	add	x8, x8, #0x8f8
102ab5bac: ad400500    	ldp	q0, q1, [x8]
102ab5bb0: ad0087e0    	stp	q0, q1, [sp, #0x10]
102ab5bb4: b9000ff4    	str	w20, [sp, #0xc]
102ab5bb8: 910033e8    	add	x8, sp, #0xc
102ab5bbc: 10000025    	adr	x5, 0x102ab5bc0 <_CMa03SUie28mjv+0x50788>
102ab5bc0: 980000cd    	ldrsw	x13, 0x102ab5bd8 <_CMa03SUie28mjv+0x507a0>
102ab5bc4: b980011b    	ldrsw	x27, [x8]
102ab5bc8: cb1b01ad    	sub	x13, x13, x27
102ab5bcc: 8b0d00a5    	add	x5, x5, x13
102ab5bd0: d28013e8    	mov	x8, #0x9f               ; =159
102ab5bd4: d61f00a0    	br	x5
102ab5bd8: 000000d1    	udf	#0xd1
102ab5bdc: 2be47d30    	<unknown>
102ab5be0: 78a0fc92    	<unknown>
102ab5be4: 079a712b    	<unknown>
102ab5be8: 028972d1    	<unknown>
102ab5bec: f94722a8    	ldr	x8, [x21, #0xe40]
102ab5bf0: f9400908    	ldr	x8, [x8, #0x10]
102ab5bf4: 910043e4    	add	x4, sp, #0x10
102ab5bf8: 910023e5    	add	x5, sp, #0x8
102ab5bfc: 52800020    	mov	w0, #0x1                ; =1
102ab5c00: 52800441    	mov	w1, #0x22               ; =34
102ab5c04: 52800003    	mov	w3, #0x0                ; =0
102ab5c08: 528001a2    	mov	w2, #0xd                ; =13
102ab5c0c: d63f0100    	blr	x8
102ab5c10: b90007ff    	str	wzr, [sp, #0x4]
102ab5c14: b9000ff4    	str	w20, [sp, #0xc]
102ab5c18: 910033e8    	add	x8, sp, #0xc
102ab5c1c: 10000025    	adr	x5, 0x102ab5c20 <_CMa03SUie28mjv+0x507e8>
102ab5c20: 980000cd    	ldrsw	x13, 0x102ab5c38 <_CMa03SUie28mjv+0x50800>
102ab5c24: b980011b    	ldrsw	x27, [x8]
102ab5c28: cb1b01ad    	sub	x13, x13, x27
102ab5c2c: 8b0d00a5    	add	x5, x5, x13
102ab5c30: d28013e8    	mov	x8, #0x9f               ; =159
102ab5c34: d61f00a0    	br	x5
102ab5c38: 000000d1    	udf	#0xd1
102ab5c3c: 2be47d30    	<unknown>
102ab5c40: 78a0fc92    	<unknown>
102ab5c44: 079a712b    	<unknown>
102ab5c48: 028972d1    	<unknown>
102ab5c4c: f94722a8    	ldr	x8, [x21, #0xe40]
102ab5c50: f9400908    	ldr	x8, [x8, #0x10]
102ab5c54: 910013e5    	add	x5, sp, #0x4
102ab5c58: 52800020    	mov	w0, #0x1                ; =1
102ab5c5c: 528000c1    	mov	w1, #0x6                ; =6
102ab5c60: 52800502    	mov	w2, #0x28               ; =40
102ab5c64: 52800003    	mov	w3, #0x0                ; =0
102ab5c68: aa1303e4    	mov	x4, x19
102ab5c6c: d63f0100    	blr	x8
102ab5c70: f9401fe8    	ldr	x8, [sp, #0x38]
102ab5c74: d0014829    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab5c78: f9438d29    	ldr	x9, [x9, #0x718]
102ab5c7c: f9400129    	ldr	x9, [x9]
102ab5c80: eb08013f    	cmp	x9, x8
102ab5c84: 54000101    	b.ne	0x102ab5ca4 <_CMa03SUie28mjv+0x5086c>
102ab5c88: 12001c00    	and	w0, w0, #0xff
102ab5c8c: a9477bfd    	ldp	x29, x30, [sp, #0x70]
102ab5c90: a9464ff4    	ldp	x20, x19, [sp, #0x60]
102ab5c94: a94557f6    	ldp	x22, x21, [sp, #0x50]
102ab5c98: a9446ffc    	ldp	x28, x27, [sp, #0x40]
102ab5c9c: 910203ff    	add	sp, sp, #0x80
102ab5ca0: d65f03c0    	ret
102ab5ca4: 97bc40dd    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a885ac: d101c3ff    	sub	sp, sp, #0x70
102a885b0: a9046ffc    	stp	x28, x27, [sp, #0x40]
102a885b4: a9054ff4    	stp	x20, x19, [sp, #0x50]
102a885b8: a9067bfd    	stp	x29, x30, [sp, #0x60]
102a885bc: 910183fd    	add	x29, sp, #0x60
102a885c0: f0014988    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102a885c4: f9438d08    	ldr	x8, [x8, #0x718]
102a885c8: f9400108    	ldr	x8, [x8]
102a885cc: f81d83a8    	stur	x8, [x29, #-0x28]
102a885d0: 52800d08    	mov	w8, #0x68               ; =104
102a885d4: b90007e8    	str	w8, [sp, #0x4]
102a885d8: 910013e8    	add	x8, sp, #0x4
102a885dc: 10000025    	adr	x5, 0x102a885e0 <_CMa03SUie28mjv+0x231a8>
102a885e0: 980000cd    	ldrsw	x13, 0x102a885f8 <_CMa03SUie28mjv+0x231c0>
102a885e4: b980011b    	ldrsw	x27, [x8]
102a885e8: cb1b01ad    	sub	x13, x13, x27
102a885ec: 8b0d00a5    	add	x5, x5, x13
102a885f0: d28013e8    	mov	x8, #0x9f               ; =159
102a885f4: d61f00a0    	br	x5
102a885f8: 00000098    	udf	#0x98
102a885fc: 2be47d30    	<unknown>
102a88600: 78a0fc92    	<unknown>
102a88604: 079a712b    	<unknown>
102a88608: 028972d1    	<unknown>
102a8860c: df7de61d    	<unknown>
102a88610: d001f373    	adrp	x19, 0x1068f6000 <dyld_stub_binder+0x1068f6000>
102a88614: 395ab269    	ldrb	w9, [x19, #0x6ac]
102a88618: 7103a11f    	cmp	w8, #0xe8
102a8861c: 7a409924    	ccmp	w9, #0x0, #0x4, ls
102a88620: 540001a1    	b.ne	0x102a88654 <_CMa03SUie28mjv+0x2321c>
102a88624: d001f360    	adrp	x0, 0x1068f6000 <dyld_stub_binder+0x1068f6000>
102a88628: 911ab400    	add	x0, x0, #0x6ad
102a8862c: 9000ecc2    	adrp	x2, 0x104820000 <dyld_stub_binder+0x104820000>
102a88630: 913c0042    	add	x2, x2, #0xf00
102a88634: b000ece3    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102a88638: 91266063    	add	x3, x3, #0x998
102a8863c: 52800101    	mov	w1, #0x8                ; =8
102a88640: 52800084    	mov	w4, #0x4                ; =4
102a88644: 52800f25    	mov	w5, #0x79               ; =121
102a88648: 946695e2    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102a8864c: 52800028    	mov	w8, #0x1                ; =1
102a88650: 391ab268    	strb	w8, [x19, #0x6ac]
102a88654: 90015548    	adrp	x8, 0x105530000 <dyld_stub_binder+0x105530000>
102a88658: 91046108    	add	x8, x8, #0x118
102a8865c: b9000bff    	str	wzr, [sp, #0x8]
102a88660: ad400500    	ldp	q0, q1, [x8]
102a88664: ad0087e0    	stp	q0, q1, [sp, #0x10]
102a88668: 528014a8    	mov	w8, #0xa5               ; =165
102a8866c: b9000fe8    	str	w8, [sp, #0xc]
102a88670: 910033e8    	add	x8, sp, #0xc
102a88674: 10000025    	adr	x5, 0x102a88678 <_CMa03SUie28mjv+0x23240>
102a88678: 980000cd    	ldrsw	x13, 0x102a88690 <_CMa03SUie28mjv+0x23258>
102a8867c: b980011b    	ldrsw	x27, [x8]
102a88680: cb1b01ad    	sub	x13, x13, x27
102a88684: 8b0d00a5    	add	x5, x5, x13
102a88688: d28013e8    	mov	x8, #0x9f               ; =159
102a8868c: d61f00a0    	br	x5
102a88690: 000000d1    	udf	#0xd1
102a88694: 2be47d30    	<unknown>
102a88698: 78a0fc92    	<unknown>
102a8869c: 079a712b    	<unknown>
102a886a0: 028972d1    	<unknown>
102a886a4: b001f368    	adrp	x8, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102a886a8: f9472108    	ldr	x8, [x8, #0xe40]
102a886ac: f9400908    	ldr	x8, [x8, #0x10]
102a886b0: 910043e4    	add	x4, sp, #0x10
102a886b4: 910023e5    	add	x5, sp, #0x8
102a886b8: 52800020    	mov	w0, #0x1                ; =1
102a886bc: 52800441    	mov	w1, #0x22               ; =34
102a886c0: 52800003    	mov	w3, #0x0                ; =0
102a886c4: 528001a2    	mov	w2, #0xd                ; =13
102a886c8: d63f0100    	blr	x8
102a886cc: f85d83a8    	ldur	x8, [x29, #-0x28]
102a886d0: f0014989    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102a886d4: f9438d29    	ldr	x9, [x9, #0x718]
102a886d8: f9400129    	ldr	x9, [x9]
102a886dc: eb08013f    	cmp	x9, x8
102a886e0: 540000e1    	b.ne	0x102a886fc <_CMa03SUie28mjv+0x232c4>
102a886e4: 52800020    	mov	w0, #0x1                ; =1
102a886e8: a9467bfd    	ldp	x29, x30, [sp, #0x60]
102a886ec: a9454ff4    	ldp	x20, x19, [sp, #0x50]
102a886f0: a9446ffc    	ldp	x28, x27, [sp, #0x40]
102a886f4: 9101c3ff    	add	sp, sp, #0x70
102a886f8: d65f03c0    	ret
102a886fc: 97bcf647    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>

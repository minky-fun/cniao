
Cainiao4iPhone: file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
; SecurityGuardOpenSecureSignature signRequest:authCode:
102ab44b4: d10243ff    	sub	sp, sp, #0x90
102ab44b8: a9036ffc    	stp	x28, x27, [sp, #0x30]
102ab44bc: a90467fa    	stp	x26, x25, [sp, #0x40]
102ab44c0: a9055ff8    	stp	x24, x23, [sp, #0x50]
102ab44c4: a90657f6    	stp	x22, x21, [sp, #0x60]
102ab44c8: a9074ff4    	stp	x20, x19, [sp, #0x70]
102ab44cc: a9087bfd    	stp	x29, x30, [sp, #0x80]
102ab44d0: 910203fd    	add	x29, sp, #0x80
102ab44d4: aa0303f3    	mov	x19, x3
102ab44d8: aa0203f4    	mov	x20, x2
102ab44dc: aa0003f6    	mov	x22, x0
102ab44e0: 52801188    	mov	w8, #0x8c               ; =140
102ab44e4: b9002be8    	str	w8, [sp, #0x28]
102ab44e8: 9100a3e8    	add	x8, sp, #0x28
102ab44ec: 10000025    	adr	x5, 0x102ab44f0 <_CMa03SUie28mjv+0x4f0b8>
102ab44f0: 980000cd    	ldrsw	x13, 0x102ab4508 <_CMa03SUie28mjv+0x4f0d0>
102ab44f4: b980011b    	ldrsw	x27, [x8]
102ab44f8: cb1b01ad    	sub	x13, x13, x27
102ab44fc: 8b0d00a5    	add	x5, x5, x13
102ab4500: d28013e8    	mov	x8, #0x9f               ; =159
102ab4504: d61f00a0    	br	x5
102ab4508: 000000b8    	udf	#0xb8
102ab450c: 2be47d30    	<unknown>
102ab4510: 78a0fc92    	<unknown>
102ab4514: 079a712b    	<unknown>
102ab4518: 028972d1    	<unknown>
102ab451c: b9002fe8    	str	w8, [sp, #0x2c]
102ab4520: 9001f235    	adrp	x21, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4524: 3951c2a9    	ldrb	w9, [x21, #0x470]
102ab4528: 7102211f    	cmp	w8, #0x88
102ab452c: 7a40a924    	ccmp	w9, #0x0, #0x4, ge
102ab4530: 540001e1    	b.ne	0x102ab456c <_CMa03SUie28mjv+0x4f134>
102ab4534: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4538: 9111c400    	add	x0, x0, #0x471
102ab453c: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4540: 91316c42    	add	x2, x2, #0xc5b
102ab4544: b000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab4548: 91264063    	add	x3, x3, #0x990
102ab454c: 52800061    	mov	w1, #0x3                ; =3
102ab4550: 52800084    	mov	w4, #0x4                ; =4
102ab4554: 52800225    	mov	w5, #0x11               ; =17
102ab4558: 9465e624    	bl	0x10442dde8 <dyld_stub_binder+0x10442dde8>
102ab455c: 52800028    	mov	w8, #0x1                ; =1
102ab4560: 3911c2a8    	strb	w8, [x21, #0x470]
102ab4564: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab4568: f944411f    	ldr	xzr, [x8, #0x880]
102ab456c: 9001f235    	adrp	x21, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4570: 3951d2a8    	ldrb	w8, [x21, #0x474]
102ab4574: 370001e8    	tbnz	w8, #0x0, 0x102ab45b0 <_CMa03SUie28mjv+0x4f178>
102ab4578: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab457c: 9111d400    	add	x0, x0, #0x475
102ab4580: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4584: 91317842    	add	x2, x2, #0xc5e
102ab4588: b000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab458c: 91267063    	add	x3, x3, #0x99c
102ab4590: 528000e1    	mov	w1, #0x7                ; =7
102ab4594: 52800084    	mov	w4, #0x4                ; =4
102ab4598: 528006a5    	mov	w5, #0x35               ; =53
102ab459c: 9465e610    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab45a0: 52800028    	mov	w8, #0x1                ; =1
102ab45a4: 3911d2a8    	strb	w8, [x21, #0x474]
102ab45a8: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab45ac: f944491f    	ldr	xzr, [x8, #0x890]
102ab45b0: 9001f235    	adrp	x21, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab45b4: 3951f2a8    	ldrb	w8, [x21, #0x47c]
102ab45b8: 370001a8    	tbnz	w8, #0x0, 0x102ab45ec <_CMa03SUie28mjv+0x4f1b4>
102ab45bc: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab45c0: 9111f400    	add	x0, x0, #0x47d
102ab45c4: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab45c8: 91319442    	add	x2, x2, #0xc65
102ab45cc: f000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab45d0: 9131a063    	add	x3, x3, #0xc68
102ab45d4: 52800061    	mov	w1, #0x3                ; =3
102ab45d8: 52800064    	mov	w4, #0x3                ; =3
102ab45dc: 52800fa5    	mov	w5, #0x7d               ; =125
102ab45e0: 9465e5fc    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab45e4: 52800028    	mov	w8, #0x1                ; =1
102ab45e8: 3911f2a8    	strb	w8, [x21, #0x47c]
102ab45ec: 9001f235    	adrp	x21, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab45f0: 395202a8    	ldrb	w8, [x21, #0x480]
102ab45f4: 7100051f    	cmp	w8, #0x1
102ab45f8: 54000081    	b.ne	0x102ab4608 <_CMa03SUie28mjv+0x4f1d0>
102ab45fc: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab4600: f944451f    	ldr	xzr, [x8, #0x888]
102ab4604: 1400001a    	b	0x102ab466c <_CMa03SUie28mjv+0x4f234>
102ab4608: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab460c: 91120400    	add	x0, x0, #0x481
102ab4610: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4614: 9131ac42    	add	x2, x2, #0xc6b
102ab4618: b000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab461c: 91265063    	add	x3, x3, #0x994
102ab4620: 528001c1    	mov	w1, #0xe                ; =14
102ab4624: 52800084    	mov	w4, #0x4                ; =4
102ab4628: 528012e5    	mov	w5, #0x97               ; =151
102ab462c: 9465e5ec    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab4630: 9001f228    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4634: b9449109    	ldr	w9, [x8, #0x490]
102ab4638: 1100392a    	add	w10, w9, #0xe
102ab463c: b904910a    	str	w10, [x8, #0x490]
102ab4640: 2a290148    	orn	w8, w10, w9
102ab4644: 0a09014a    	and	w10, w10, w9
102ab4648: 4b090149    	sub	w9, w10, w9
102ab464c: 4b080128    	sub	w8, w9, w8
102ab4650: 71000d1f    	cmp	w8, #0x3
102ab4654: 54000081    	b.ne	0x102ab4664 <_CMa03SUie28mjv+0x4f22c>
102ab4658: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab465c: f9443d1f    	ldr	xzr, [x8, #0x878]
102ab4660: 14000003    	b	0x102ab466c <_CMa03SUie28mjv+0x4f234>
102ab4664: 52800028    	mov	w8, #0x1                ; =1
102ab4668: 391202a8    	strb	w8, [x21, #0x480]
102ab466c: 9001f235    	adrp	x21, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4670: 39534ea8    	ldrb	w8, [x21, #0x4d3]
102ab4674: 370001e8    	tbnz	w8, #0x0, 0x102ab46b0 <_CMa03SUie28mjv+0x4f278>
102ab4678: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab467c: 91135000    	add	x0, x0, #0x4d4
102ab4680: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4684: 9132f842    	add	x2, x2, #0xcbe
102ab4688: b000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab468c: 91266063    	add	x3, x3, #0x998
102ab4690: 52800061    	mov	w1, #0x3                ; =3
102ab4694: 52800084    	mov	w4, #0x4                ; =4
102ab4698: 52800f25    	mov	w5, #0x79               ; =121
102ab469c: 9465e5cd    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab46a0: 52800028    	mov	w8, #0x1                ; =1
102ab46a4: 39134ea8    	strb	w8, [x21, #0x4d3]
102ab46a8: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab46ac: f9444d1f    	ldr	xzr, [x8, #0x898]
102ab46b0: aa1403e0    	mov	x0, x20
102ab46b4: 9465f485    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab46b8: aa0003f8    	mov	x24, x0
102ab46bc: aa1303e0    	mov	x0, x19
102ab46c0: 9465f482    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab46c4: aa0003f3    	mov	x19, x0
102ab46c8: 9001baa8    	adrp	x8, 0x106208000 <dyld_stub_binder+0x106208000>
102ab46cc: f947b901    	ldr	x1, [x8, #0xf70] ; selector: appKey
102ab46d0: aa1803e0    	mov	x0, x24
102ab46d4: 9465f45c    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab46d8: aa1d03fd    	mov	x29, x29
102ab46dc: 9465f484    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab46e0: aa0003f4    	mov	x20, x0
102ab46e4: 9001bd48    	adrp	x8, 0x10625c000 <dyld_stub_binder+0x10625c000>
102ab46e8: f945e101    	ldr	x1, [x8, #0xbc0] ; selector: paramDict
102ab46ec: aa1803e0    	mov	x0, x24
102ab46f0: 9465f455    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab46f4: aa1d03fd    	mov	x29, x29
102ab46f8: 9465f47d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab46fc: aa0003f5    	mov	x21, x0
102ab4700: f001bda8    	adrp	x8, 0x10626b000 <dyld_stub_binder+0x10626b000>
102ab4704: f9433901    	ldr	x1, [x8, #0x670] ; selector: requestType
102ab4708: aa1803e0    	mov	x0, x24
102ab470c: 9465f44e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4710: aa0003f7    	mov	x23, x0
102ab4714: aa1803e0    	mov	x0, x24
102ab4718: 9465f466    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab471c: f001bffc    	adrp	x28, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab4720: b40010f4    	cbz	x20, 0x102ab493c <_CMa03SUie28mjv+0x4f504>
102ab4724: f942ab80    	ldr	x0, [x28, #0x550]
102ab4728: b001bb08    	adrp	x8, 0x106215000 <dyld_stub_binder+0x106215000>
102ab472c: f940411a    	ldr	x26, [x8, #0x80] ; selector: class
102ab4730: aa1a03e1    	mov	x1, x26
102ab4734: 9465f444    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4738: aa0003e2    	mov	x2, x0
102ab473c: b001bc88    	adrp	x8, 0x106245000 <dyld_stub_binder+0x106245000>
102ab4740: f947a118    	ldr	x24, [x8, #0xf40] ; selector: isKindOfClass:
102ab4744: aa1403e0    	mov	x0, x20
102ab4748: aa1803e1    	mov	x1, x24
102ab474c: 9465f43e    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4750: 34000f60    	cbz	w0, 0x102ab493c <_CMa03SUie28mjv+0x4f504>
102ab4754: f001bca8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab4758: f944e919    	ldr	x25, [x8, #0x9d0] ; selector: length
102ab475c: aa1403e0    	mov	x0, x20
102ab4760: aa1903e1    	mov	x1, x25
102ab4764: 9465f438    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4768: b4000eb5    	cbz	x21, 0x102ab493c <_CMa03SUie28mjv+0x4f504>
102ab476c: b4000e80    	cbz	x0, 0x102ab493c <_CMa03SUie28mjv+0x4f504>
102ab4770: f90013f6    	str	x22, [sp, #0x20]
102ab4774: f001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab4778: f9429500    	ldr	x0, [x8, #0x528]
102ab477c: aa1a03e1    	mov	x1, x26
102ab4780: 9465f431    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4784: 9001f228    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4788: b9449116    	ldr	w22, [x8, #0x490]
102ab478c: 11003ec9    	add	w9, w22, #0xf
102ab4790: b9049109    	str	w9, [x8, #0x490]
102ab4794: 0a36013a    	bic	w26, w9, w22
102ab4798: 128001e8    	mov	w8, #-0x10              ; =-16
102ab479c: 4b160108    	sub	w8, w8, w22
102ab47a0: 4a2802c8    	eon	w8, w22, w8
102ab47a4: 2a16012a    	orr	w10, w9, w22
102ab47a8: 0b090108    	add	w8, w8, w9
102ab47ac: 4b1a0108    	sub	w8, w8, w26
102ab47b0: 6b0a011f    	cmp	w8, w10
102ab47b4: 540000c1    	b.ne	0x102ab47cc <_CMa03SUie28mjv+0x4f394>
102ab47b8: aa0003e2    	mov	x2, x0
102ab47bc: aa1503e0    	mov	x0, x21
102ab47c0: aa1803e1    	mov	x1, x24
102ab47c4: 9465f420    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab47c8: 36000880    	tbz	w0, #0x0, 0x102ab48d8 <_CMa03SUie28mjv+0x4f4a0>
102ab47cc: b9001ffa    	str	w26, [sp, #0x1c]
102ab47d0: d0015408    	adrp	x8, 0x105536000 <dyld_stub_binder+0x105536000>
102ab47d4: d503201f    	nop
102ab47d8: f945191a    	ldr	x26, [x8, #0xa30]
102ab47dc: f001bd08    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
102ab47e0: f942411b    	ldr	x27, [x8, #0x480] ; selector: objectForKeyedSubscript:
102ab47e4: aa1503e0    	mov	x0, x21
102ab47e8: aa1b03e1    	mov	x1, x27
102ab47ec: aa1a03e2    	mov	x2, x26
102ab47f0: 9465f415    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab47f4: aa1d03fd    	mov	x29, x29
102ab47f8: 9465f43d    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab47fc: aa0003f8    	mov	x24, x0
102ab4800: b40001a0    	cbz	x0, 0x102ab4834 <_CMa03SUie28mjv+0x4f3fc>
102ab4804: aa1503e0    	mov	x0, x21
102ab4808: aa1b03e1    	mov	x1, x27
102ab480c: aa1a03e2    	mov	x2, x26
102ab4810: 9465f40d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4814: aa1d03fd    	mov	x29, x29
102ab4818: 9465f435    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab481c: aa0003fa    	mov	x26, x0
102ab4820: aa1903e1    	mov	x1, x25
102ab4824: 9465f408    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4828: b40004e0    	cbz	x0, 0x102ab48c4 <_CMa03SUie28mjv+0x4f48c>
102ab482c: 5280003b    	mov	w27, #0x1               ; =1
102ab4830: 14000002    	b	0x102ab4838 <_CMa03SUie28mjv+0x4f400>
102ab4834: 5280001b    	mov	w27, #0x0               ; =0
102ab4838: b000eba8    	adrp	x8, 0x104829000 <dyld_stub_binder+0x104829000>
102ab483c: d503201f    	nop
102ab4840: f943cd08    	ldr	x8, [x8, #0x798]
102ab4844: eb0802ff    	cmp	x23, x8
102ab4848: 540003cb    	b.lt	0x102ab48c0 <_CMa03SUie28mjv+0x4f488>
102ab484c: b000eba8    	adrp	x8, 0x104829000 <dyld_stub_binder+0x104829000>
102ab4850: d503201f    	nop
102ab4854: f943ed08    	ldr	x8, [x8, #0x7d8]
102ab4858: eb0802ff    	cmp	x23, x8
102ab485c: 5400032a    	b.ge	0x102ab48c0 <_CMa03SUie28mjv+0x4f488>
102ab4860: b001bc88    	adrp	x8, 0x106245000 <dyld_stub_binder+0x106245000>
102ab4864: f9404101    	ldr	x1, [x8, #0x80] ; selector: isEqualToString:
102ab4868: d00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab486c: 912d6042    	add	x2, x2, #0xb58
102ab4870: aa1303e0    	mov	x0, x19
102ab4874: 9465f3f4    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4878: aa0003f9    	mov	x25, x0
102ab487c: 3400059b    	cbz	w27, 0x102ab492c <_CMa03SUie28mjv+0x4f4f4>
102ab4880: b9401fe9    	ldr	w9, [sp, #0x1c]
102ab4884: 2a2902c8    	orn	w8, w22, w9
102ab4888: 0b080128    	add	w8, w9, w8
102ab488c: 52800029    	mov	w9, #0x1                ; =1
102ab4890: 4b080136    	sub	w22, w9, w8
102ab4894: aa1a03e0    	mov	x0, x26
102ab4898: 9465f406    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab489c: aa1803e0    	mov	x0, x24
102ab48a0: 9465f404    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab48a4: 71000adf    	cmp	w22, #0x2
102ab48a8: 54ffff61    	b.ne	0x102ab4894 <_CMa03SUie28mjv+0x4f45c>
102ab48ac: f94013e0    	ldr	x0, [sp, #0x20]
102ab48b0: 34000cb9    	cbz	w25, 0x102ab4a44 <_CMa03SUie28mjv+0x4f60c>
102ab48b4: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab48b8: f944391f    	ldr	xzr, [x8, #0x870]
102ab48bc: 14000020    	b	0x102ab493c <_CMa03SUie28mjv+0x4f504>
102ab48c0: 3600007b    	tbz	w27, #0x0, 0x102ab48cc <_CMa03SUie28mjv+0x4f494>
102ab48c4: aa1a03e0    	mov	x0, x26
102ab48c8: 9465f3fa    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab48cc: aa1803e0    	mov	x0, x24
102ab48d0: 9465f3f8    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab48d4: 1400001a    	b	0x102ab493c <_CMa03SUie28mjv+0x4f504>
102ab48d8: 52801b68    	mov	w8, #0xdb               ; =219
102ab48dc: b9002be8    	str	w8, [sp, #0x28]
102ab48e0: 9100b3e8    	add	x8, sp, #0x2c
102ab48e4: 9100a3e9    	add	x9, sp, #0x28
102ab48e8: 10000027    	adr	x7, 0x102ab48ec <_CMa03SUie28mjv+0x4f4b4>
102ab48ec: 9800015a    	ldrsw	x26, 0x102ab4914 <_CMa03SUie28mjv+0x4f4dc>
102ab48f0: aa3a03fa    	mvn	x26, x26
102ab48f4: aa3a03fa    	mvn	x26, x26
102ab48f8: 9102bb5a    	add	x26, x26, #0xae
102ab48fc: b9800125    	ldrsw	x5, [x9]
102ab4900: 8b05035a    	add	x26, x26, x5
102ab4904: 8b1a00e7    	add	x7, x7, x26
102ab4908: 528000f0    	mov	w16, #0x7               ; =7
102ab490c: b9000110    	str	w16, [x8]
102ab4910: d61f00e0    	br	x7
102ab4914: fffffeb3    	<unknown>
102ab4918: ba73439a    	<unknown>
102ab491c: 219d051f    	<unknown>
102ab4920: c1560291    	fmls	za.s[w8, 1, vgx2], { z20.s, z21.s }, z6.s[0]
102ab4924: ff7fbd2c    	<unknown>
102ab4928: 14000005    	b	0x102ab493c <_CMa03SUie28mjv+0x4f504>
102ab492c: aa1803e0    	mov	x0, x24
102ab4930: 9465f3e0    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4934: f94013e0    	ldr	x0, [sp, #0x20]
102ab4938: 36000879    	tbz	w25, #0x0, 0x102ab4a44 <_CMa03SUie28mjv+0x4f60c>
102ab493c: 9001f228    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4940: 91120508    	add	x8, x8, #0x481
102ab4944: f942ab80    	ldr	x0, [x28, #0x550]
102ab4948: 9001bf69    	adrp	x9, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102ab494c: f9467137    	ldr	x23, [x9, #0xce0] ; selector: stringWithFormat:
102ab4950: f90003e8    	str	x8, [sp]
102ab4954: d00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab4958: 912a6042    	add	x2, x2, #0xa98
102ab495c: aa1703e1    	mov	x1, x23
102ab4960: 9465f3b9    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4964: aa1d03fd    	mov	x29, x29
102ab4968: 9465f3e1    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab496c: aa0003f6    	mov	x22, x0
102ab4970: b4000460    	cbz	x0, 0x102ab49fc <_CMa03SUie28mjv+0x4f5c4>
102ab4974: f942ab80    	ldr	x0, [x28, #0x550]
102ab4978: 52804b28    	mov	w8, #0x259              ; =601
102ab497c: f90003e8    	str	x8, [sp]
102ab4980: aa1703e1    	mov	x1, x23
102ab4984: aa1603e2    	mov	x2, x22
102ab4988: 9465f3af    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab498c: aa1d03fd    	mov	x29, x29
102ab4990: 9465f3d7    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4994: aa0003f8    	mov	x24, x0
102ab4998: f001bca8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab499c: f944e901    	ldr	x1, [x8, #0x9d0] ; selector: length
102ab49a0: 90015939    	adrp	x25, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102ab49a4: 9123e339    	add	x25, x25, #0x8f8
102ab49a8: aa1903e0    	mov	x0, x25
102ab49ac: 9465f3a6    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab49b0: b40001a0    	cbz	x0, 0x102ab49e4 <_CMa03SUie28mjv+0x4f5ac>
102ab49b4: f942ab80    	ldr	x0, [x28, #0x550]
102ab49b8: a90067f8    	stp	x24, x25, [sp]
102ab49bc: d00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab49c0: 912ae042    	add	x2, x2, #0xab8
102ab49c4: aa1703e1    	mov	x1, x23
102ab49c8: 9465f39f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab49cc: aa1d03fd    	mov	x29, x29
102ab49d0: 9465f3c7    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab49d4: aa0003f7    	mov	x23, x0
102ab49d8: aa1803e0    	mov	x0, x24
102ab49dc: 9465f3b5    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab49e0: aa1703f8    	mov	x24, x23
102ab49e4: f90003f8    	str	x24, [sp]
102ab49e8: d00164c0    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab49ec: 912b6000    	add	x0, x0, #0xad8
102ab49f0: 9465e654    	bl	0x10442e340 <dyld_stub_binder+0x10442e340>
102ab49f4: aa1803e0    	mov	x0, x24
102ab49f8: 9465f3ae    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab49fc: aa1603e0    	mov	x0, x22
102ab4a00: 9465f3ac    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4a04: d2800016    	mov	x22, #0x0               ; =0
102ab4a08: aa1503e0    	mov	x0, x21
102ab4a0c: 9465f3a9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4a10: aa1403e0    	mov	x0, x20
102ab4a14: 9465f3a7    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4a18: aa1303e0    	mov	x0, x19
102ab4a1c: 9465f3a5    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4a20: aa1603e0    	mov	x0, x22
102ab4a24: a9487bfd    	ldp	x29, x30, [sp, #0x80]
102ab4a28: a9474ff4    	ldp	x20, x19, [sp, #0x70]
102ab4a2c: a94657f6    	ldp	x22, x21, [sp, #0x60]
102ab4a30: a9455ff8    	ldp	x24, x23, [sp, #0x50]
102ab4a34: a94467fa    	ldp	x26, x25, [sp, #0x40]
102ab4a38: a9436ffc    	ldp	x28, x27, [sp, #0x30]
102ab4a3c: 910243ff    	add	sp, sp, #0x90
102ab4a40: 1465f342    	b	0x104431748 <dyld_stub_binder+0x104431748>
102ab4a44: b001bae8    	adrp	x8, 0x106211000 <dyld_stub_binder+0x106211000>
102ab4a48: f941e101    	ldr	x1, [x8, #0x3c0] ; selector: callCoreSignFunctionsWithArray:appKey:signType:mask:
102ab4a4c: aa1503e2    	mov	x2, x21
102ab4a50: aa1403e3    	mov	x3, x20
102ab4a54: aa1703e4    	mov	x4, x23
102ab4a58: aa1303e5    	mov	x5, x19
102ab4a5c: 9465f37a    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4a60: aa1d03fd    	mov	x29, x29
102ab4a64: 9465f3a2    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4a68: aa0003f6    	mov	x22, x0
102ab4a6c: f27efaff    	tst	x23, #0xfffffffffffffffd
102ab4a70: 54fffcc1    	b.ne	0x102ab4a08 <_CMa03SUie28mjv+0x4f5d0>
102ab4a74: f001bfa8    	adrp	x8, 0x1062ab000 <dyld_stub_binder+0x1062ab000>
102ab4a78: f947c101    	ldr	x1, [x8, #0xf80] ; selector: uppercaseString
102ab4a7c: aa1603e0    	mov	x0, x22
102ab4a80: 9465f371    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4a84: aa1d03fd    	mov	x29, x29
102ab4a88: 9465f399    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4a8c: aa0003f7    	mov	x23, x0
102ab4a90: aa1603e0    	mov	x0, x22
102ab4a94: 9465f387    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4a98: aa1703f6    	mov	x22, x23
102ab4a9c: 17ffffdb    	b	0x102ab4a08 <_CMa03SUie28mjv+0x4f5d0>
; SecurityGuardOpenSecureSignature getSafeCookie:secretKey:authCode:
102ab4aa0: d10243ff    	sub	sp, sp, #0x90
102ab4aa4: a9036ffc    	stp	x28, x27, [sp, #0x30]
102ab4aa8: a90467fa    	stp	x26, x25, [sp, #0x40]
102ab4aac: a9055ff8    	stp	x24, x23, [sp, #0x50]
102ab4ab0: a90657f6    	stp	x22, x21, [sp, #0x60]
102ab4ab4: a9074ff4    	stp	x20, x19, [sp, #0x70]
102ab4ab8: a9087bfd    	stp	x29, x30, [sp, #0x80]
102ab4abc: 910203fd    	add	x29, sp, #0x80
102ab4ac0: aa0403f5    	mov	x21, x4
102ab4ac4: aa0303f4    	mov	x20, x3
102ab4ac8: aa0203f3    	mov	x19, x2
102ab4acc: f0014828    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab4ad0: f9438d08    	ldr	x8, [x8, #0x718]
102ab4ad4: f9400108    	ldr	x8, [x8]
102ab4ad8: f90017e8    	str	x8, [sp, #0x28]
102ab4adc: 52800ee8    	mov	w8, #0x77               ; =119
102ab4ae0: b90017e8    	str	w8, [sp, #0x14]
102ab4ae4: 910053e8    	add	x8, sp, #0x14
102ab4ae8: 1000003c    	adr	x28, 0x102ab4aec <_CMa03SUie28mjv+0x4f6b4>
102ab4aec: 98000106    	ldrsw	x6, 0x102ab4b0c <_CMa03SUie28mjv+0x4f6d4>
102ab4af0: d2801042    	mov	x2, #0x82               ; =130
102ab4af4: ca0200c6    	eor	x6, x6, x2
102ab4af8: b9800105    	ldrsw	x5, [x8]
102ab4afc: 8b0500c6    	add	x6, x6, x5
102ab4b00: 8b06039c    	add	x28, x28, x6
102ab4b04: d2800468    	mov	x8, #0x23               ; =35
102ab4b08: d61f0380    	br	x28
102ab4b0c: ffffff43    	<unknown>
102ab4b10: 219a21a6    	<unknown>
102ab4b14: 396131d7    	ldrb	w23, [x14, #0x84c]
102ab4b18: 0d361236    	<unknown>
102ab4b1c: 1cd648b2    	ldr	s18, 0x102a61430 <_uP0zKbWVU9+0xffd8>
102ab4b20: 7f900c71    	<unknown>
102ab4b24: 9001f236    	adrp	x22, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4b28: 39531ac9    	ldrb	w9, [x22, #0x4c6]
102ab4b2c: 7100551f    	cmp	w8, #0x15
102ab4b30: 7a40a924    	ccmp	w9, #0x0, #0x4, ge
102ab4b34: 540001a1    	b.ne	0x102ab4b68 <_CMa03SUie28mjv+0x4f730>
102ab4b38: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4b3c: 91131c00    	add	x0, x0, #0x4c7
102ab4b40: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4b44: 9132b442    	add	x2, x2, #0xcad
102ab4b48: f000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4b4c: 9132cc63    	add	x3, x3, #0xcb3
102ab4b50: 528000c1    	mov	w1, #0x6                ; =6
102ab4b54: 52800064    	mov	w4, #0x3                ; =3
102ab4b58: 528010e5    	mov	w5, #0x87               ; =135
102ab4b5c: 9465e4a0    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab4b60: 52800028    	mov	w8, #0x1                ; =1
102ab4b64: 39131ac8    	strb	w8, [x22, #0x4c6]
102ab4b68: 9001f236    	adrp	x22, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4b6c: 395336c8    	ldrb	w8, [x22, #0x4cd]
102ab4b70: 370001a8    	tbnz	w8, #0x0, 0x102ab4ba4 <_CMa03SUie28mjv+0x4f76c>
102ab4b74: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4b78: 91133800    	add	x0, x0, #0x4ce
102ab4b7c: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4b80: 9132d842    	add	x2, x2, #0xcb6
102ab4b84: f000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4b88: 9132ec63    	add	x3, x3, #0xcbb
102ab4b8c: 528000a1    	mov	w1, #0x5                ; =5
102ab4b90: 52800064    	mov	w4, #0x3                ; =3
102ab4b94: 528005a5    	mov	w5, #0x2d               ; =45
102ab4b98: 9465e491    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab4b9c: 52800028    	mov	w8, #0x1                ; =1
102ab4ba0: 391336c8    	strb	w8, [x22, #0x4cd]
102ab4ba4: aa1303e0    	mov	x0, x19
102ab4ba8: 9465f348    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab4bac: aa0003f3    	mov	x19, x0
102ab4bb0: aa1403e0    	mov	x0, x20
102ab4bb4: 9465f345    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab4bb8: aa0003f4    	mov	x20, x0
102ab4bbc: aa1503e0    	mov	x0, x21
102ab4bc0: 9465f342    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab4bc4: aa0003f5    	mov	x21, x0
102ab4bc8: b40011b3    	cbz	x19, 0x102ab4dfc <_CMa03SUie28mjv+0x4f9c4>
102ab4bcc: b4001194    	cbz	x20, 0x102ab4dfc <_CMa03SUie28mjv+0x4f9c4>
102ab4bd0: d001c008    	adrp	x8, 0x1062b6000 <dyld_stub_binder+0x1062b6000>
102ab4bd4: f9455916    	ldr	x22, [x8, #0xab0]
102ab4bd8: d0015408    	adrp	x8, 0x105536000 <dyld_stub_binder+0x105536000>
102ab4bdc: d503201f    	nop
102ab4be0: f9451908    	ldr	x8, [x8, #0xa30]
102ab4be4: a901cfe8    	stp	x8, x19, [sp, #0x18]
102ab4be8: f001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab4bec: f9429500    	ldr	x0, [x8, #0x528]
102ab4bf0: d001bb68    	adrp	x8, 0x106222000 <dyld_stub_binder+0x106222000>
102ab4bf4: f946d101    	ldr	x1, [x8, #0xda0] ; selector: dictionaryWithObjects:forKeys:count:
102ab4bf8: 910083e2    	add	x2, sp, #0x20
102ab4bfc: 910063e3    	add	x3, sp, #0x18
102ab4c00: 52800024    	mov	w4, #0x1                ; =1
102ab4c04: 9465f310    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4c08: aa1d03fd    	mov	x29, x29
102ab4c0c: 9465f338    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4c10: aa0003f7    	mov	x23, x0
102ab4c14: b000eba8    	adrp	x8, 0x104829000 <dyld_stub_binder+0x104829000>
102ab4c18: d503201f    	nop
102ab4c1c: f943d504    	ldr	x4, [x8, #0x7a8]
102ab4c20: 9001bb48    	adrp	x8, 0x10621c000 <dyld_stub_binder+0x10621c000>
102ab4c24: f9459901    	ldr	x1, [x8, #0xb30] ; selector: createParamContextWithAppKey:paramDict:requestType:
102ab4c28: aa1603e0    	mov	x0, x22
102ab4c2c: aa1403e2    	mov	x2, x20
102ab4c30: aa1703e3    	mov	x3, x23
102ab4c34: 9465f304    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4c38: aa1d03fd    	mov	x29, x29
102ab4c3c: 9465f32c    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4c40: aa0003f6    	mov	x22, x0
102ab4c44: aa1703e0    	mov	x0, x23
102ab4c48: 9465f31a    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4c4c: 9001c01a    	adrp	x26, 0x1062b4000 <dyld_stub_binder+0x1062b4000>
102ab4c50: f9428340    	ldr	x0, [x26, #0x500]
102ab4c54: d001bbe8    	adrp	x8, 0x106232000 <dyld_stub_binder+0x106232000>
102ab4c58: f9470519    	ldr	x25, [x8, #0xe08] ; selector: getInstance
102ab4c5c: aa1903e1    	mov	x1, x25
102ab4c60: 9465f2f9    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4c64: aa1d03fd    	mov	x29, x29
102ab4c68: 9465f321    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4c6c: aa0003f8    	mov	x24, x0
102ab4c70: b001bc08    	adrp	x8, 0x106235000 <dyld_stub_binder+0x106235000>
102ab4c74: f9403901    	ldr	x1, [x8, #0x70] ; selector: getSecureSignatureComp
102ab4c78: 9465f2f3    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4c7c: aa1d03fd    	mov	x29, x29
102ab4c80: 9465f31b    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4c84: aa0003f7    	mov	x23, x0
102ab4c88: aa1803e0    	mov	x0, x24
102ab4c8c: 9465f309    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4c90: b4000bf7    	cbz	x23, 0x102ab4e0c <_CMa03SUie28mjv+0x4f9d4>
102ab4c94: 9001bf48    	adrp	x8, 0x10629c000 <dyld_stub_binder+0x10629c000>
102ab4c98: f942f101    	ldr	x1, [x8, #0x5e0] ; selector: signRequest:authCode:
102ab4c9c: aa1703e0    	mov	x0, x23
102ab4ca0: aa1603e2    	mov	x2, x22
102ab4ca4: aa1503e3    	mov	x3, x21
102ab4ca8: 9465f2e7    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4cac: aa1d03fd    	mov	x29, x29
102ab4cb0: 9465f30f    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4cb4: aa0003f8    	mov	x24, x0
102ab4cb8: b4000ae0    	cbz	x0, 0x102ab4e14 <_CMa03SUie28mjv+0x4f9dc>
102ab4cbc: f001bca8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab4cc0: f944e901    	ldr	x1, [x8, #0x9d0] ; selector: length
102ab4cc4: aa1803e0    	mov	x0, x24
102ab4cc8: 9465f2df    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4ccc: b4000a80    	cbz	x0, 0x102ab4e1c <_CMa03SUie28mjv+0x4f9e4>
102ab4cd0: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab4cd4: f944551f    	ldr	xzr, [x8, #0x8a8]
102ab4cd8: f9428340    	ldr	x0, [x26, #0x500]
102ab4cdc: aa1903e1    	mov	x1, x25
102ab4ce0: 9465f2d9    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4ce4: aa1d03fd    	mov	x29, x29
102ab4ce8: 9465f301    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4cec: aa0003fa    	mov	x26, x0
102ab4cf0: b001bc08    	adrp	x8, 0x106235000 <dyld_stub_binder+0x106235000>
102ab4cf4: f9426501    	ldr	x1, [x8, #0x4c8] ; selector: getStaticDataEncryptComp
102ab4cf8: 9465f2d3    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4cfc: aa1d03fd    	mov	x29, x29
102ab4d00: 9465f2fb    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4d04: aa0003f9    	mov	x25, x0
102ab4d08: aa1a03e0    	mov	x0, x26
102ab4d0c: 9465f2e9    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4d10: b40008f9    	cbz	x25, 0x102ab4e2c <_CMa03SUie28mjv+0x4f9f4>
102ab4d14: f001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab4d18: f942a900    	ldr	x0, [x8, #0x550]
102ab4d1c: 9001bf68    	adrp	x8, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102ab4d20: f946711b    	ldr	x27, [x8, #0xce0] ; selector: stringWithFormat:
102ab4d24: a9004ff8    	stp	x24, x19, [sp]
102ab4d28: d00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab4d2c: 912c6042    	add	x2, x2, #0xb18
102ab4d30: aa1b03e1    	mov	x1, x27
102ab4d34: 9465f2c4    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4d38: aa1d03fd    	mov	x29, x29
102ab4d3c: 9465f2ec    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4d40: aa0003fa    	mov	x26, x0
102ab4d44: b000eba8    	adrp	x8, 0x104829000 <dyld_stub_binder+0x104829000>
102ab4d48: d503201f    	nop
102ab4d4c: f9421902    	ldr	x2, [x8, #0x430]
102ab4d50: f001bf48    	adrp	x8, 0x10629f000 <dyld_stub_binder+0x10629f000>
102ab4d54: f9446901    	ldr	x1, [x8, #0x8d0] ; selector: staticSafeEncrypt:forKey:forNeedProcessValue:authCode:
102ab4d58: aa1903e0    	mov	x0, x25
102ab4d5c: aa1403e3    	mov	x3, x20
102ab4d60: aa1a03e4    	mov	x4, x26
102ab4d64: aa1503e5    	mov	x5, x21
102ab4d68: 9465f2b7    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4d6c: aa1d03fd    	mov	x29, x29
102ab4d70: 9465f2df    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4d74: b4000600    	cbz	x0, 0x102ab4e34 <_CMa03SUie28mjv+0x4f9fc>
102ab4d78: aa0003fc    	mov	x28, x0
102ab4d7c: f001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab4d80: f942a900    	ldr	x0, [x8, #0x550]
102ab4d84: d00164c8    	adrp	x8, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab4d88: 912ce108    	add	x8, x8, #0xb38
102ab4d8c: a90073e8    	stp	x8, x28, [sp]
102ab4d90: d00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab4d94: 912c6042    	add	x2, x2, #0xb18
102ab4d98: aa1b03e1    	mov	x1, x27
102ab4d9c: 9465f2aa    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab4da0: 9001f228    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4da4: b9449109    	ldr	w9, [x8, #0x490]
102ab4da8: 1100092a    	add	w10, w9, #0x2
102ab4dac: b904910a    	str	w10, [x8, #0x490]
102ab4db0: 52955568    	mov	w8, #0xaaab             ; =43691
102ab4db4: 72b55548    	movk	w8, #0xaaaa, lsl #16
102ab4db8: 9b087d28    	mul	x8, x9, x8
102ab4dbc: d362fd08    	lsr	x8, x8, #34
102ab4dc0: 528000ca    	mov	w10, #0x6               ; =6
102ab4dc4: 1b0aa508    	msub	w8, w8, w10, w9
102ab4dc8: 1100b508    	add	w8, w8, #0x2d
102ab4dcc: 2a480508    	orr	w8, w8, w8, lsr #1
102ab4dd0: 2a480908    	orr	w8, w8, w8, lsr #2
102ab4dd4: 2a481108    	orr	w8, w8, w8, lsr #4
102ab4dd8: 2a482108    	orr	w8, w8, w8, lsr #8
102ab4ddc: 2a484108    	orr	w8, w8, w8, lsr #16
102ab4de0: 71007d1f    	cmp	w8, #0x1f
102ab4de4: 540002a0    	b.eq	0x102ab4e38 <_CMa03SUie28mjv+0x4fa00>
102ab4de8: 9465f2c1    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab4dec: aa0003fb    	mov	x27, x0
102ab4df0: aa1c03e0    	mov	x0, x28
102ab4df4: 9465f2af    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4df8: 14000010    	b	0x102ab4e38 <_CMa03SUie28mjv+0x4fa00>
102ab4dfc: d280001b    	mov	x27, #0x0               ; =0
102ab4e00: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab4e04: f944591f    	ldr	xzr, [x8, #0x8b0]
102ab4e08: 14000016    	b	0x102ab4e60 <_CMa03SUie28mjv+0x4fa28>
102ab4e0c: d280001b    	mov	x27, #0x0               ; =0
102ab4e10: 14000010    	b	0x102ab4e50 <_CMa03SUie28mjv+0x4fa18>
102ab4e14: d280001b    	mov	x27, #0x0               ; =0
102ab4e18: 1400000c    	b	0x102ab4e48 <_CMa03SUie28mjv+0x4fa10>
102ab4e1c: d280001b    	mov	x27, #0x0               ; =0
102ab4e20: d00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab4e24: f944511f    	ldr	xzr, [x8, #0x8a0]
102ab4e28: 14000008    	b	0x102ab4e48 <_CMa03SUie28mjv+0x4fa10>
102ab4e2c: d280001b    	mov	x27, #0x0               ; =0
102ab4e30: 14000004    	b	0x102ab4e40 <_CMa03SUie28mjv+0x4fa08>
102ab4e34: d280001b    	mov	x27, #0x0               ; =0
102ab4e38: aa1a03e0    	mov	x0, x26
102ab4e3c: 9465f29d    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e40: aa1903e0    	mov	x0, x25
102ab4e44: 9465f29b    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e48: aa1803e0    	mov	x0, x24
102ab4e4c: 9465f299    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e50: aa1703e0    	mov	x0, x23
102ab4e54: 9465f297    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e58: aa1603e0    	mov	x0, x22
102ab4e5c: 9465f295    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e60: aa1503e0    	mov	x0, x21
102ab4e64: 9465f293    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e68: aa1403e0    	mov	x0, x20
102ab4e6c: 9465f291    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e70: aa1303e0    	mov	x0, x19
102ab4e74: 9465f28f    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab4e78: f94017e8    	ldr	x8, [sp, #0x28]
102ab4e7c: f0014829    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab4e80: f9438d29    	ldr	x9, [x9, #0x718]
102ab4e84: f9400129    	ldr	x9, [x9]
102ab4e88: eb08013f    	cmp	x9, x8
102ab4e8c: 54000141    	b.ne	0x102ab4eb4 <_CMa03SUie28mjv+0x4fa7c>
102ab4e90: aa1b03e0    	mov	x0, x27
102ab4e94: a9487bfd    	ldp	x29, x30, [sp, #0x80]
102ab4e98: a9474ff4    	ldp	x20, x19, [sp, #0x70]
102ab4e9c: a94657f6    	ldp	x22, x21, [sp, #0x60]
102ab4ea0: a9455ff8    	ldp	x24, x23, [sp, #0x50]
102ab4ea4: a94467fa    	ldp	x26, x25, [sp, #0x40]
102ab4ea8: a9436ffc    	ldp	x28, x27, [sp, #0x30]
102ab4eac: 910243ff    	add	sp, sp, #0x90
102ab4eb0: 1465f226    	b	0x104431748 <dyld_stub_binder+0x104431748>
102ab4eb4: 97bc4459    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>
; SecurityGuardOpenSecureSignature getMetaClass
102ab4eb8: d10083ff    	sub	sp, sp, #0x20
102ab4ebc: a9016ffc    	stp	x28, x27, [sp, #0x10]
102ab4ec0: 52801ea8    	mov	w8, #0xf5               ; =245
102ab4ec4: b9000fe8    	str	w8, [sp, #0xc]
102ab4ec8: 910033e8    	add	x8, sp, #0xc
102ab4ecc: 1000003c    	adr	x28, 0x102ab4ed0 <_CMa03SUie28mjv+0x4fa98>
102ab4ed0: 9800010f    	ldrsw	x15, 0x102ab4ef0 <_CMa03SUie28mjv+0x4fab8>
102ab4ed4: aa2f03ef    	mvn	x15, x15
102ab4ed8: 910169ef    	add	x15, x15, #0x5a
102ab4edc: b9800110    	ldrsw	x16, [x8]
102ab4ee0: ca1001ef    	eor	x15, x15, x16
102ab4ee4: 8b0f039c    	add	x28, x28, x15
102ab4ee8: d2801d68    	mov	x8, #0xeb               ; =235
102ab4eec: d61f0380    	br	x28
102ab4ef0: ffffff98    	<unknown>
102ab4ef4: 9e752336    	<unknown>
102ab4ef8: 3ef66260    	<unknown>
102ab4efc: be48f86e    	<unknown>
102ab4f00: 22d35413    	<unknown>
102ab4f04: 9001c068    	adrp	x8, 0x1062c0000 <dyld_stub_binder+0x1062c0000>
102ab4f08: f9401900    	ldr	x0, [x8, #0x30]
102ab4f0c: b001bb08    	adrp	x8, 0x106215000 <dyld_stub_binder+0x106215000>
102ab4f10: f9404101    	ldr	x1, [x8, #0x80] ; selector: class
102ab4f14: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102ab4f18: 910083ff    	add	sp, sp, #0x20
102ab4f1c: 1465f24a    	b	0x104431844 <dyld_stub_binder+0x104431844>
; SecurityGuardOpenSecureSignature NSDictionary2HashMap:
102ab4f20: d10683ff    	sub	sp, sp, #0x1a0
102ab4f24: a9146ffc    	stp	x28, x27, [sp, #0x140]
102ab4f28: a91567fa    	stp	x26, x25, [sp, #0x150]
102ab4f2c: a9165ff8    	stp	x24, x23, [sp, #0x160]
102ab4f30: a91757f6    	stp	x22, x21, [sp, #0x170]
102ab4f34: a9184ff4    	stp	x20, x19, [sp, #0x180]
102ab4f38: a9197bfd    	stp	x29, x30, [sp, #0x190]
102ab4f3c: 910643fd    	add	x29, sp, #0x190
102ab4f40: aa0203f3    	mov	x19, x2
102ab4f44: f0014828    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab4f48: f9438d08    	ldr	x8, [x8, #0x718]
102ab4f4c: f9400108    	ldr	x8, [x8]
102ab4f50: f81a03a8    	stur	x8, [x29, #-0x60]
102ab4f54: 528002a8    	mov	w8, #0x15               ; =21
102ab4f58: b9006fe8    	str	w8, [sp, #0x6c]
102ab4f5c: 9101b3e8    	add	x8, sp, #0x6c
102ab4f60: 1000003a    	adr	x26, 0x102ab4f64 <_CMa03SUie28mjv+0x4fb2c>
102ab4f64: 9800012a    	ldrsw	x10, 0x102ab4f88 <_CMa03SUie28mjv+0x4fb50>
102ab4f68: 9102f54a    	add	x10, x10, #0xbd
102ab4f6c: d2800c0d    	mov	x13, #0x60              ; =96
102ab4f70: ca0d014a    	eor	x10, x10, x13
102ab4f74: b980010e    	ldrsw	x14, [x8]
102ab4f78: cb0e014a    	sub	x10, x10, x14
102ab4f7c: 8b0a035a    	add	x26, x26, x10
102ab4f80: d2800768    	mov	x8, #0x3b               ; =59
102ab4f84: d61f0340    	br	x26
102ab4f88: ffffff6c    	<unknown>
102ab4f8c: 5ed9f9aa    	<unknown>
102ab4f90: cdca64c6    	<unknown>
102ab4f94: 1c7ec4ba    	ldr	s26, 0x102bb2828 <_CSe03oNkHsjGbE+0x24928>
102ab4f98: 9001f234    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4f9c: 39525288    	ldrb	w8, [x20, #0x494]
102ab4fa0: 370001a8    	tbnz	w8, #0x0, 0x102ab4fd4 <_CMa03SUie28mjv+0x4fb9c>
102ab4fa4: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4fa8: 91125400    	add	x0, x0, #0x495
102ab4fac: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4fb0: 9131e442    	add	x2, x2, #0xc79
102ab4fb4: f000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4fb8: 9132a863    	add	x3, x3, #0xcaa
102ab4fbc: 52800621    	mov	w1, #0x31               ; =49
102ab4fc0: 52800064    	mov	w4, #0x3                ; =3
102ab4fc4: 52800d65    	mov	w5, #0x6b               ; =107
102ab4fc8: 9465e388    	bl	0x10442dde8 <dyld_stub_binder+0x10442dde8>
102ab4fcc: 52800028    	mov	w8, #0x1                ; =1
102ab4fd0: 39125288    	strb	w8, [x20, #0x494]
102ab4fd4: 9001f234    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4fd8: 3951c288    	ldrb	w8, [x20, #0x470]
102ab4fdc: 370001a8    	tbnz	w8, #0x0, 0x102ab5010 <_CMa03SUie28mjv+0x4fbd8>
102ab4fe0: 9001f220    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab4fe4: 9111c400    	add	x0, x0, #0x471
102ab4fe8: f000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab4fec: 91316c42    	add	x2, x2, #0xc5b
102ab4ff0: b000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab4ff4: 91264063    	add	x3, x3, #0x990
102ab4ff8: 52800061    	mov	w1, #0x3                ; =3
102ab4ffc: 52800084    	mov	w4, #0x4                ; =4
102ab5000: 52800225    	mov	w5, #0x11               ; =17
102ab5004: 9465e379    	bl	0x10442dde8 <dyld_stub_binder+0x10442dde8>
102ab5008: 52800028    	mov	w8, #0x1                ; =1
102ab500c: 3911c288    	strb	w8, [x20, #0x470]
102ab5010: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5014: 3951d288    	ldrb	w8, [x20, #0x474]
102ab5018: 370001a8    	tbnz	w8, #0x0, 0x102ab504c <_CMa03SUie28mjv+0x4fc14>
102ab501c: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5020: 9111d400    	add	x0, x0, #0x475
102ab5024: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5028: 91317842    	add	x2, x2, #0xc5e
102ab502c: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab5030: 91267063    	add	x3, x3, #0x99c
102ab5034: 528000e1    	mov	w1, #0x7                ; =7
102ab5038: 52800084    	mov	w4, #0x4                ; =4
102ab503c: 528006a5    	mov	w5, #0x35               ; =53
102ab5040: 9465e367    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab5044: 52800028    	mov	w8, #0x1                ; =1
102ab5048: 3911d288    	strb	w8, [x20, #0x474]
102ab504c: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5050: 3951f288    	ldrb	w8, [x20, #0x47c]
102ab5054: 370001a8    	tbnz	w8, #0x0, 0x102ab5088 <_CMa03SUie28mjv+0x4fc50>
102ab5058: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab505c: 9111f400    	add	x0, x0, #0x47d
102ab5060: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5064: 91319442    	add	x2, x2, #0xc65
102ab5068: d000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab506c: 9131a063    	add	x3, x3, #0xc68
102ab5070: 52800061    	mov	w1, #0x3                ; =3
102ab5074: 52800064    	mov	w4, #0x3                ; =3
102ab5078: 52800fa5    	mov	w5, #0x7d               ; =125
102ab507c: 9465e355    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab5080: 52800028    	mov	w8, #0x1                ; =1
102ab5084: 3911f288    	strb	w8, [x20, #0x47c]
102ab5088: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab508c: 39520288    	ldrb	w8, [x20, #0x480]
102ab5090: 370001a8    	tbnz	w8, #0x0, 0x102ab50c4 <_CMa03SUie28mjv+0x4fc8c>
102ab5094: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5098: 91120400    	add	x0, x0, #0x481
102ab509c: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab50a0: 9131ac42    	add	x2, x2, #0xc6b
102ab50a4: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab50a8: 91265063    	add	x3, x3, #0x994
102ab50ac: 528001c1    	mov	w1, #0xe                ; =14
102ab50b0: 52800084    	mov	w4, #0x4                ; =4
102ab50b4: 528012e5    	mov	w5, #0x97               ; =151
102ab50b8: 9465e349    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab50bc: 52800028    	mov	w8, #0x1                ; =1
102ab50c0: 39120288    	strb	w8, [x20, #0x480]
102ab50c4: aa1303e0    	mov	x0, x19
102ab50c8: 9465f200    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab50cc: aa0003f3    	mov	x19, x0
102ab50d0: b4001940    	cbz	x0, 0x102ab53f8 <_CMa03SUie28mjv+0x4ffc0>
102ab50d4: 97ff96b6    	bl	0x102a9abac <_CMa03SUie28mjv+0x35774>
102ab50d8: f90013e0    	str	x0, [sp, #0x20]
102ab50dc: 4f00e400    	movi.16b	v0, #0x0
102ab50e0: ad0383e0    	stp	q0, q0, [sp, #0x70]
102ab50e4: ad0483e0    	stp	q0, q0, [sp, #0x90]
102ab50e8: aa1303e0    	mov	x0, x19
102ab50ec: 9465f1f7    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab50f0: aa0003f5    	mov	x21, x0
102ab50f4: d001bb28    	adrp	x8, 0x10621b000 <dyld_stub_binder+0x10621b000>
102ab50f8: f943a901    	ldr	x1, [x8, #0x750] ; selector: countByEnumeratingWithState:objects:count:
102ab50fc: 9101c3e2    	add	x2, sp, #0x70
102ab5100: 9102c3e3    	add	x3, sp, #0xb0
102ab5104: f9000fe1    	str	x1, [sp, #0x18]
102ab5108: 52800204    	mov	w4, #0x10               ; =16
102ab510c: 9465f1ce    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5110: b40016e0    	cbz	x0, 0x102ab53ec <_CMa03SUie28mjv+0x4ffb4>
102ab5114: aa0003f7    	mov	x23, x0
102ab5118: f9000bf3    	str	x19, [sp, #0x10]
102ab511c: f94043e8    	ldr	x8, [sp, #0x80]
102ab5120: f9400113    	ldr	x19, [x8]
102ab5124: f001f21a    	adrp	x26, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5128: d001bff8    	adrp	x24, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab512c: b00164dc    	adrp	x28, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab5130: 912be39c    	add	x28, x28, #0xaf8
102ab5134: f9001bf5    	str	x21, [sp, #0x30]
102ab5138: d2800016    	mov	x22, #0x0               ; =0
102ab513c: d001bd08    	adrp	x8, 0x106257000 <dyld_stub_binder+0x106257000>
102ab5140: f941d508    	ldr	x8, [x8, #0x3a8] ; selector: objectForKey:
102ab5144: f90033e8    	str	x8, [sp, #0x60]
102ab5148: 9001bb08    	adrp	x8, 0x106215000 <dyld_stub_binder+0x106215000>
102ab514c: f9404108    	ldr	x8, [x8, #0x80] ; selector: class
102ab5150: f9002be8    	str	x8, [sp, #0x50]
102ab5154: 9001bc88    	adrp	x8, 0x106245000 <dyld_stub_binder+0x106245000>
102ab5158: f947a108    	ldr	x8, [x8, #0xf40] ; selector: isKindOfClass:
102ab515c: f90027e8    	str	x8, [sp, #0x48]
102ab5160: d001bfa8    	adrp	x8, 0x1062ab000 <dyld_stub_binder+0x1062ab000>
102ab5164: f947c108    	ldr	x8, [x8, #0xf80] ; selector: uppercaseString
102ab5168: f90017e8    	str	x8, [sp, #0x28]
102ab516c: f001bac8    	adrp	x8, 0x106210000 <dyld_stub_binder+0x106210000>
102ab5170: f9421108    	ldr	x8, [x8, #0x420] ; selector: cStringUsingEncoding:
102ab5174: f90023e8    	str	x8, [sp, #0x40]
102ab5178: f001bf48    	adrp	x8, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102ab517c: f9467119    	ldr	x25, [x8, #0xce0] ; selector: stringWithFormat:
102ab5180: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab5184: 91230108    	add	x8, x8, #0x8c0
102ab5188: d001bca9    	adrp	x9, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab518c: f944e929    	ldr	x9, [x9, #0x9d0] ; selector: length
102ab5190: f9001fe9    	str	x9, [sp, #0x38]
102ab5194: f9002ff9    	str	x25, [sp, #0x58]
102ab5198: f940011f    	ldr	xzr, [x8]
102ab519c: f94043e8    	ldr	x8, [sp, #0x80]
102ab51a0: b9449349    	ldr	w9, [x26, #0x490]
102ab51a4: 11001d29    	add	w9, w9, #0x7
102ab51a8: b9049349    	str	w9, [x26, #0x490]
102ab51ac: f9400108    	ldr	x8, [x8]
102ab51b0: eb13011f    	cmp	x8, x19
102ab51b4: 54000060    	b.eq	0x102ab51c0 <_CMa03SUie28mjv+0x4fd88>
102ab51b8: aa1503e0    	mov	x0, x21
102ab51bc: 9465f17b    	bl	0x1044317a8 <dyld_stub_binder+0x1044317a8>
102ab51c0: f9403fe8    	ldr	x8, [sp, #0x78]
102ab51c4: f8767914    	ldr	x20, [x8, x22, lsl #3]
102ab51c8: aa1503e0    	mov	x0, x21
102ab51cc: f94033e1    	ldr	x1, [sp, #0x60]
102ab51d0: aa1403e2    	mov	x2, x20
102ab51d4: 9465f19c    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab51d8: aa1d03fd    	mov	x29, x29
102ab51dc: 9465f1c4    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab51e0: aa0003fb    	mov	x27, x0
102ab51e4: b4000700    	cbz	x0, 0x102ab52c4 <_CMa03SUie28mjv+0x4fe8c>
102ab51e8: f942ab00    	ldr	x0, [x24, #0x550]
102ab51ec: f9402be1    	ldr	x1, [sp, #0x50]
102ab51f0: 9465f195    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab51f4: aa0003e2    	mov	x2, x0
102ab51f8: aa1b03e0    	mov	x0, x27
102ab51fc: f94027e1    	ldr	x1, [sp, #0x48]
102ab5200: 9465f191    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5204: 360005c0    	tbz	w0, #0x0, 0x102ab52bc <_CMa03SUie28mjv+0x4fe84>
102ab5208: aa1503f8    	mov	x24, x21
102ab520c: aa1a03f5    	mov	x21, x26
102ab5210: aa1303fa    	mov	x26, x19
102ab5214: aa1703fc    	mov	x28, x23
102ab5218: aa1403e0    	mov	x0, x20
102ab521c: f94017e1    	ldr	x1, [sp, #0x28]
102ab5220: 9465f189    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5224: aa1d03fd    	mov	x29, x29
102ab5228: 9465f1b1    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab522c: aa0003f4    	mov	x20, x0
102ab5230: aa1b03e0    	mov	x0, x27
102ab5234: 9465f1a8    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab5238: f94023e1    	ldr	x1, [sp, #0x40]
102ab523c: 52800082    	mov	w2, #0x4                ; =4
102ab5240: 9465f181    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5244: aa0003f3    	mov	x19, x0
102ab5248: 97fef4e5    	bl	0x102a725dc <_CMa03SUie28mjv+0xd1a4>
102ab524c: aa0003f9    	mov	x25, x0
102ab5250: b4000080    	cbz	x0, 0x102ab5260 <_CMa03SUie28mjv+0x4fe28>
102ab5254: aa1903e0    	mov	x0, x25
102ab5258: aa1303e1    	mov	x1, x19
102ab525c: 97fef4c5    	bl	0x102a72570 <_CMa03SUie28mjv+0xd138>
102ab5260: f94013f7    	ldr	x23, [sp, #0x20]
102ab5264: f94026f3    	ldr	x19, [x23, #0x48]
102ab5268: aa1403e0    	mov	x0, x20
102ab526c: 9465f19a    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab5270: aa0003f4    	mov	x20, x0
102ab5274: f94023e1    	ldr	x1, [sp, #0x40]
102ab5278: 52800082    	mov	w2, #0x4                ; =4
102ab527c: 9465f172    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5280: aa0003e1    	mov	x1, x0
102ab5284: aa1703e0    	mov	x0, x23
102ab5288: aa1903e2    	mov	x2, x25
102ab528c: 52800003    	mov	w3, #0x0                ; =0
102ab5290: d63f0260    	blr	x19
102ab5294: aa1c03f7    	mov	x23, x28
102ab5298: aa1a03e8    	mov	x8, x26
102ab529c: aa1503fa    	mov	x26, x21
102ab52a0: aa1803f5    	mov	x21, x24
102ab52a4: d001bff8    	adrp	x24, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab52a8: b00164dc    	adrp	x28, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab52ac: 912be39c    	add	x28, x28, #0xaf8
102ab52b0: aa0803f3    	mov	x19, x8
102ab52b4: f9402ff9    	ldr	x25, [sp, #0x58]
102ab52b8: 14000039    	b	0x102ab539c <_CMa03SUie28mjv+0x4ff64>
102ab52bc: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab52c0: f944651f    	ldr	xzr, [x8, #0x8c8]
102ab52c4: f942ab00    	ldr	x0, [x24, #0x550]
102ab52c8: f001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab52cc: 91120508    	add	x8, x8, #0x481
102ab52d0: f90003e8    	str	x8, [sp]
102ab52d4: aa1903e1    	mov	x1, x25
102ab52d8: b00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab52dc: 912a6042    	add	x2, x2, #0xa98
102ab52e0: 9465f159    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab52e4: aa1d03fd    	mov	x29, x29
102ab52e8: 9465f181    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab52ec: aa0003f4    	mov	x20, x0
102ab52f0: b4000560    	cbz	x0, 0x102ab539c <_CMa03SUie28mjv+0x4ff64>
102ab52f4: aa1703f5    	mov	x21, x23
102ab52f8: aa1303f7    	mov	x23, x19
102ab52fc: f942ab00    	ldr	x0, [x24, #0x550]
102ab5300: 52804b28    	mov	w8, #0x259              ; =601
102ab5304: f90003e8    	str	x8, [sp]
102ab5308: aa1903e1    	mov	x1, x25
102ab530c: aa1403e2    	mov	x2, x20
102ab5310: 9465f14d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5314: aa1d03fd    	mov	x29, x29
102ab5318: 9465f175    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab531c: aa1903f3    	mov	x19, x25
102ab5320: aa0003f9    	mov	x25, x0
102ab5324: aa1c03e0    	mov	x0, x28
102ab5328: f9401fe1    	ldr	x1, [sp, #0x38]
102ab532c: 9465f146    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5330: b4000220    	cbz	x0, 0x102ab5374 <_CMa03SUie28mjv+0x4ff3c>
102ab5334: f942ab00    	ldr	x0, [x24, #0x550]
102ab5338: a90073f9    	stp	x25, x28, [sp]
102ab533c: aa1303e1    	mov	x1, x19
102ab5340: b00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab5344: 912ae042    	add	x2, x2, #0xab8
102ab5348: 9465f13f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab534c: b9449348    	ldr	w8, [x26, #0x490]
102ab5350: 11000508    	add	w8, w8, #0x1
102ab5354: b9049348    	str	w8, [x26, #0x490]
102ab5358: 9465f165    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab535c: aa0003f3    	mov	x19, x0
102ab5360: aa1903e0    	mov	x0, x25
102ab5364: 9465f153    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5368: aa1303f9    	mov	x25, x19
102ab536c: b00164dc    	adrp	x28, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab5370: 912be39c    	add	x28, x28, #0xaf8
102ab5374: aa1703f3    	mov	x19, x23
102ab5378: f90003f9    	str	x25, [sp]
102ab537c: b00164c0    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab5380: 912b6000    	add	x0, x0, #0xad8
102ab5384: 9465e3ef    	bl	0x10442e340 <dyld_stub_binder+0x10442e340>
102ab5388: aa1903e0    	mov	x0, x25
102ab538c: 9465f149    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5390: f9402ff9    	ldr	x25, [sp, #0x58]
102ab5394: aa1503f7    	mov	x23, x21
102ab5398: f9401bf5    	ldr	x21, [sp, #0x30]
102ab539c: aa1403e0    	mov	x0, x20
102ab53a0: 9465f144    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab53a4: aa1b03e0    	mov	x0, x27
102ab53a8: 9465f142    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab53ac: 910006d6    	add	x22, x22, #0x1
102ab53b0: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab53b4: 91234108    	add	x8, x8, #0x8d0
102ab53b8: eb1702df    	cmp	x22, x23
102ab53bc: 54ffeee3    	b.lo	0x102ab5198 <_CMa03SUie28mjv+0x4fd60>
102ab53c0: 9101c3e2    	add	x2, sp, #0x70
102ab53c4: 9102c3e3    	add	x3, sp, #0xb0
102ab53c8: aa1503e0    	mov	x0, x21
102ab53cc: f9400fe1    	ldr	x1, [sp, #0x18]
102ab53d0: 52800204    	mov	w4, #0x10               ; =16
102ab53d4: 9465f11c    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab53d8: aa0003f7    	mov	x23, x0
102ab53dc: b5ffeae0    	cbnz	x0, 0x102ab5138 <_CMa03SUie28mjv+0x4fd00>
102ab53e0: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab53e4: f9445d1f    	ldr	xzr, [x8, #0x8b8]
102ab53e8: f9400bf3    	ldr	x19, [sp, #0x10]
102ab53ec: aa1503e0    	mov	x0, x21
102ab53f0: 9465f130    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab53f4: 14000002    	b	0x102ab53fc <_CMa03SUie28mjv+0x4ffc4>
102ab53f8: f90013ff    	str	xzr, [sp, #0x20]
102ab53fc: aa1303e0    	mov	x0, x19
102ab5400: 9465f12c    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5404: f85a03a8    	ldur	x8, [x29, #-0x60]
102ab5408: d0014829    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102ab540c: f9438d29    	ldr	x9, [x9, #0x718]
102ab5410: f9400129    	ldr	x9, [x9]
102ab5414: eb08013f    	cmp	x9, x8
102ab5418: 54000141    	b.ne	0x102ab5440 <_CMa03SUie28mjv+0x50008>
102ab541c: f94013e0    	ldr	x0, [sp, #0x20]
102ab5420: a9597bfd    	ldp	x29, x30, [sp, #0x190]
102ab5424: a9584ff4    	ldp	x20, x19, [sp, #0x180]
102ab5428: a95757f6    	ldp	x22, x21, [sp, #0x170]
102ab542c: a9565ff8    	ldp	x24, x23, [sp, #0x160]
102ab5430: a95567fa    	ldp	x26, x25, [sp, #0x150]
102ab5434: a9546ffc    	ldp	x28, x27, [sp, #0x140]
102ab5438: 910683ff    	add	sp, sp, #0x1a0
102ab543c: d65f03c0    	ret
102ab5440: 97bc42f6    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>
; SecurityGuardOpenSecureSignature callCoreSignFunctionsWithArray:appKey:signType:mask:
102ab5444: d102c3ff    	sub	sp, sp, #0xb0
102ab5448: a9056ffc    	stp	x28, x27, [sp, #0x50]
102ab544c: a90667fa    	stp	x26, x25, [sp, #0x60]
102ab5450: a9075ff8    	stp	x24, x23, [sp, #0x70]
102ab5454: a90857f6    	stp	x22, x21, [sp, #0x80]
102ab5458: a9094ff4    	stp	x20, x19, [sp, #0x90]
102ab545c: a90a7bfd    	stp	x29, x30, [sp, #0xa0]
102ab5460: 910283fd    	add	x29, sp, #0xa0
102ab5464: aa0503f6    	mov	x22, x5
102ab5468: aa0403f5    	mov	x21, x4
102ab546c: aa0303f3    	mov	x19, x3
102ab5470: aa0203f8    	mov	x24, x2
102ab5474: aa0003f7    	mov	x23, x0
102ab5478: 52800fe8    	mov	w8, #0x7f               ; =127
102ab547c: b9001fe8    	str	w8, [sp, #0x1c]
102ab5480: 910083e8    	add	x8, sp, #0x20
102ab5484: 910073e9    	add	x9, sp, #0x1c
102ab5488: 10000031    	adr	x17, 0x102ab548c <_CMa03SUie28mjv+0x50054>
102ab548c: 9800010c    	ldrsw	x12, 0x102ab54ac <_CMa03SUie28mjv+0x50074>
102ab5490: aa2c03ec    	mvn	x12, x12
102ab5494: b9800134    	ldrsw	x20, [x9]
102ab5498: ca14018c    	eor	x12, x12, x20
102ab549c: 8b0c0231    	add	x17, x17, x12
102ab54a0: 5280149a    	mov	w26, #0xa4              ; =164
102ab54a4: b900011a    	str	w26, [x8]
102ab54a8: d61f0220    	br	x17
102ab54ac: ffffffb4    	<unknown>
102ab54b0: 5e46e527    	<unknown>
102ab54b4: 2b976a66    	adds	w6, w19, w23, asr #26
102ab54b8: 0fc401da    	fmlalb	v26, v14, v4[0]
102ab54bc: 27300aa5    	<unknown>
102ab54c0: b94023e8    	ldr	w8, [sp, #0x20]
102ab54c4: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab54c8: 3951c289    	ldrb	w9, [x20, #0x470]
102ab54cc: 71020d1f    	cmp	w8, #0x83
102ab54d0: 7a401924    	ccmp	w9, #0x0, #0x4, ne
102ab54d4: 540001a1    	b.ne	0x102ab5508 <_CMa03SUie28mjv+0x500d0>
102ab54d8: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab54dc: 9111c400    	add	x0, x0, #0x471
102ab54e0: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab54e4: 91316c42    	add	x2, x2, #0xc5b
102ab54e8: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab54ec: 91264063    	add	x3, x3, #0x990
102ab54f0: 52800061    	mov	w1, #0x3                ; =3
102ab54f4: 52800084    	mov	w4, #0x4                ; =4
102ab54f8: 52800225    	mov	w5, #0x11               ; =17
102ab54fc: 9465e23b    	bl	0x10442dde8 <dyld_stub_binder+0x10442dde8>
102ab5500: 52800028    	mov	w8, #0x1                ; =1
102ab5504: 3911c288    	strb	w8, [x20, #0x470]
102ab5508: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab550c: 3951d288    	ldrb	w8, [x20, #0x474]
102ab5510: 370001a8    	tbnz	w8, #0x0, 0x102ab5544 <_CMa03SUie28mjv+0x5010c>
102ab5514: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5518: 9111d400    	add	x0, x0, #0x475
102ab551c: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5520: 91317842    	add	x2, x2, #0xc5e
102ab5524: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab5528: 91267063    	add	x3, x3, #0x99c
102ab552c: 528000e1    	mov	w1, #0x7                ; =7
102ab5530: 52800084    	mov	w4, #0x4                ; =4
102ab5534: 528006a5    	mov	w5, #0x35               ; =53
102ab5538: 9465e229    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab553c: 52800028    	mov	w8, #0x1                ; =1
102ab5540: 3911d288    	strb	w8, [x20, #0x474]
102ab5544: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5548: 3951f288    	ldrb	w8, [x20, #0x47c]
102ab554c: 370001a8    	tbnz	w8, #0x0, 0x102ab5580 <_CMa03SUie28mjv+0x50148>
102ab5550: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5554: 9111f400    	add	x0, x0, #0x47d
102ab5558: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab555c: 91319442    	add	x2, x2, #0xc65
102ab5560: d000eb63    	adrp	x3, 0x104823000 <dyld_stub_binder+0x104823000>
102ab5564: 9131a063    	add	x3, x3, #0xc68
102ab5568: 52800061    	mov	w1, #0x3                ; =3
102ab556c: 52800064    	mov	w4, #0x3                ; =3
102ab5570: 52800fa5    	mov	w5, #0x7d               ; =125
102ab5574: 9465e217    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102ab5578: 52800028    	mov	w8, #0x1                ; =1
102ab557c: 3911f288    	strb	w8, [x20, #0x47c]
102ab5580: f001f214    	adrp	x20, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5584: 39520288    	ldrb	w8, [x20, #0x480]
102ab5588: 370003e8    	tbnz	w8, #0x0, 0x102ab5604 <_CMa03SUie28mjv+0x501cc>
102ab558c: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab5590: f944791f    	ldr	xzr, [x8, #0x8f0]
102ab5594: f001f200    	adrp	x0, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5598: 91120400    	add	x0, x0, #0x481
102ab559c: d000eb62    	adrp	x2, 0x104823000 <dyld_stub_binder+0x104823000>
102ab55a0: 9131ac42    	add	x2, x2, #0xc6b
102ab55a4: 9000eb83    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102ab55a8: 91265063    	add	x3, x3, #0x994
102ab55ac: 528001c1    	mov	w1, #0xe                ; =14
102ab55b0: 52800084    	mov	w4, #0x4                ; =4
102ab55b4: 528012e5    	mov	w5, #0x97               ; =151
102ab55b8: 9465e209    	bl	0x10442dddc <dyld_stub_binder+0x10442dddc>
102ab55bc: f001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab55c0: b9449109    	ldr	w9, [x8, #0x490]
102ab55c4: 1100312a    	add	w10, w9, #0xc
102ab55c8: b904910a    	str	w10, [x8, #0x490]
102ab55cc: 12001d28    	and	w8, w9, #0xff
102ab55d0: 1b087d08    	mul	w8, w8, w8
102ab55d4: 0b290108    	add	w8, w8, w9, uxtb
102ab55d8: 11001d08    	add	w8, w8, #0x7
102ab55dc: 12003d08    	and	w8, w8, #0xffff
102ab55e0: 52891629    	mov	w9, #0x48b1             ; =18609
102ab55e4: 72af0329    	movk	w9, #0x7819, lsl #16
102ab55e8: 1b097d08    	mul	w8, w8, w9
102ab55ec: 5282c409    	mov	w9, #0x1620             ; =5664
102ab55f0: 72a06529    	movk	w9, #0x329, lsl #16
102ab55f4: 6b09011f    	cmp	w8, w9
102ab55f8: 54000063    	b.lo	0x102ab5604 <_CMa03SUie28mjv+0x501cc>
102ab55fc: 52800028    	mov	w8, #0x1                ; =1
102ab5600: 39120288    	strb	w8, [x20, #0x480]
102ab5604: aa1803e0    	mov	x0, x24
102ab5608: 9465f0b0    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab560c: aa0003f8    	mov	x24, x0
102ab5610: aa1303e0    	mov	x0, x19
102ab5614: 9465f0ad    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab5618: aa0003f3    	mov	x19, x0
102ab561c: aa1603e0    	mov	x0, x22
102ab5620: 9465f0aa    	bl	0x1044318c8 <dyld_stub_binder+0x1044318c8>
102ab5624: aa0003f4    	mov	x20, x0
102ab5628: d001ba48    	adrp	x8, 0x1061ff000 <dyld_stub_binder+0x1061ff000>
102ab562c: f9458901    	ldr	x1, [x8, #0xb10] ; selector: NSDictionary2HashMap:
102ab5630: aa1703e0    	mov	x0, x23
102ab5634: aa1803e2    	mov	x2, x24
102ab5638: 9465f083    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab563c: aa0003f6    	mov	x22, x0
102ab5640: aa1803e0    	mov	x0, x24
102ab5644: 9465f09b    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5648: b4000876    	cbz	x22, 0x102ab5754 <_CMa03SUie28mjv+0x5031c>
102ab564c: b9400ada    	ldr	w26, [x22, #0x8]
102ab5650: 3400087a    	cbz	w26, 0x102ab575c <_CMa03SUie28mjv+0x50324>
102ab5654: b001bf88    	adrp	x8, 0x1062a6000 <dyld_stub_binder+0x1062a6000>
102ab5658: f9458501    	ldr	x1, [x8, #0xb08] ; selector: transferOpenSignType:
102ab565c: aa1703e0    	mov	x0, x23
102ab5660: aa1503e2    	mov	x2, x21
102ab5664: 9465f078    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5668: aa0003f5    	mov	x21, x0
102ab566c: f90017f6    	str	x22, [sp, #0x28]
102ab5670: f0015908    	adrp	x8, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102ab5674: 9123e108    	add	x8, x8, #0x8f8
102ab5678: f100027f    	cmp	x19, #0x0
102ab567c: 9a930100    	csel	x0, x8, x19, eq
102ab5680: 9465f095    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab5684: f001bac8    	adrp	x8, 0x106210000 <dyld_stub_binder+0x106210000>
102ab5688: f9421117    	ldr	x23, [x8, #0x420] ; selector: cStringUsingEncoding:
102ab568c: aa1703e1    	mov	x1, x23
102ab5690: 52800082    	mov	w2, #0x4                ; =4
102ab5694: 9465f06c    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5698: f9001be0    	str	x0, [sp, #0x30]
102ab569c: aa1403e0    	mov	x0, x20
102ab56a0: 9465f08d    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab56a4: aa1703e1    	mov	x1, x23
102ab56a8: 52800082    	mov	w2, #0x4                ; =4
102ab56ac: 9465f066    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab56b0: f9001fe0    	str	x0, [sp, #0x38]
102ab56b4: 29087ff5    	stp	w21, wzr, [sp, #0x40]
102ab56b8: 52800c68    	mov	w8, #0x63               ; =99
102ab56bc: b90027e8    	str	w8, [sp, #0x24]
102ab56c0: 52800fc8    	mov	w8, #0x7e               ; =126
102ab56c4: b9004fe8    	str	w8, [sp, #0x4c]
102ab56c8: 910133e8    	add	x8, sp, #0x4c
102ab56cc: 10000035    	adr	x21, 0x102ab56d0 <_CMa03SUie28mjv+0x50298>
102ab56d0: 980000d1    	ldrsw	x17, 0x102ab56e8 <_CMa03SUie28mjv+0x502b0>
102ab56d4: b9800117    	ldrsw	x23, [x8]
102ab56d8: 8b170231    	add	x17, x17, x23
102ab56dc: 8b1102b5    	add	x21, x21, x17
102ab56e0: d2800e88    	mov	x8, #0x74               ; =116
102ab56e4: d61f02a0    	br	x21
102ab56e8: ffffffae    	<unknown>
102ab56ec: d7219a21    	<unknown>
102ab56f0: 36396131    	tbz	w17, #0x7, 0x102ab8314 <_CMa03SUie28mjv+0x52edc>
102ab56f4: b20d3612    	orr	x18, x16, #0xfff80001fff80001
102ab56f8: 711cd648    	subs	w8, w18, #0x735
102ab56fc: b001f208    	adrp	x8, 0x1068f6000 <dyld_stub_binder+0x1068f6000>
102ab5700: f943c508    	ldr	x8, [x8, #0x788]
102ab5704: 9100a3e1    	add	x1, sp, #0x28
102ab5708: 910093e2    	add	x2, sp, #0x24
102ab570c: 528539a0    	mov	w0, #0x29cd             ; =10701
102ab5710: d63f0100    	blr	x8
102ab5714: b40002c0    	cbz	x0, 0x102ab576c <_CMa03SUie28mjv+0x50334>
102ab5718: aa0003f5    	mov	x21, x0
102ab571c: f9400008    	ldr	x8, [x0]
102ab5720: b4000848    	cbz	x8, 0x102ab5828 <_CMa03SUie28mjv+0x503f0>
102ab5724: d001bfe8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab5728: f942a900    	ldr	x0, [x8, #0x550]
102ab572c: 9465eff2    	bl	0x1044316f4 <dyld_stub_binder+0x1044316f4>
102ab5730: f94002a2    	ldr	x2, [x21]
102ab5734: b001bc48    	adrp	x8, 0x10623e000 <dyld_stub_binder+0x10623e000>
102ab5738: f942e501    	ldr	x1, [x8, #0x5c8] ; selector: initWithCString:encoding:
102ab573c: 52800083    	mov	w3, #0x4                ; =4
102ab5740: 9465f041    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab5744: aa0003f7    	mov	x23, x0
102ab5748: f94002a0    	ldr	x0, [x21]
102ab574c: 9465ec75    	bl	0x104430920 <dyld_stub_binder+0x104430920>
102ab5750: 14000037    	b	0x102ab582c <_CMa03SUie28mjv+0x503f4>
102ab5754: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab5758: f944751f    	ldr	xzr, [x8, #0x8e8]
102ab575c: aa1603e0    	mov	x0, x22
102ab5760: 97ff9778    	bl	0x102a9b540 <_CMa03SUie28mjv+0x36108>
102ab5764: d2800017    	mov	x23, #0x0               ; =0
102ab5768: 1400004a    	b	0x102ab5890 <_CMa03SUie28mjv+0x50458>
102ab576c: b98027f8    	ldrsw	x24, [sp, #0x24]
102ab5770: d001bffb    	adrp	x27, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102ab5774: f942ab60    	ldr	x0, [x27, #0x550]
102ab5778: f001bf48    	adrp	x8, 0x1062a0000 <dyld_stub_binder+0x1062a0000>
102ab577c: f9467117    	ldr	x23, [x8, #0xce0] ; selector: stringWithFormat:
102ab5780: f001f208    	adrp	x8, 0x1068f8000 <dyld_stub_binder+0x1068f8000>
102ab5784: 91120508    	add	x8, x8, #0x481
102ab5788: f90003e8    	str	x8, [sp]
102ab578c: b00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab5790: 912a6042    	add	x2, x2, #0xa98
102ab5794: aa1703e1    	mov	x1, x23
102ab5798: 9465f02b    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab579c: aa1d03fd    	mov	x29, x29
102ab57a0: 9465f053    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab57a4: aa0003f5    	mov	x21, x0
102ab57a8: b4000580    	cbz	x0, 0x102ab5858 <_CMa03SUie28mjv+0x50420>
102ab57ac: 91096308    	add	x8, x24, #0x258
102ab57b0: f942ab60    	ldr	x0, [x27, #0x550]
102ab57b4: f90003e8    	str	x8, [sp]
102ab57b8: aa1703e1    	mov	x1, x23
102ab57bc: aa1503e2    	mov	x2, x21
102ab57c0: 9465f021    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab57c4: aa1d03fd    	mov	x29, x29
102ab57c8: 9465f049    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab57cc: aa0003f8    	mov	x24, x0
102ab57d0: d001bca8    	adrp	x8, 0x10624b000 <dyld_stub_binder+0x10624b000>
102ab57d4: f944e901    	ldr	x1, [x8, #0x9d0] ; selector: length
102ab57d8: f0015919    	adrp	x25, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102ab57dc: 9123e339    	add	x25, x25, #0x8f8
102ab57e0: aa1903e0    	mov	x0, x25
102ab57e4: 9465f018    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab57e8: b4000280    	cbz	x0, 0x102ab5838 <_CMa03SUie28mjv+0x50400>
102ab57ec: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab57f0: f944711f    	ldr	xzr, [x8, #0x8e0]
102ab57f4: f942ab60    	ldr	x0, [x27, #0x550]
102ab57f8: a90067f8    	stp	x24, x25, [sp]
102ab57fc: b00164c2    	adrp	x2, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab5800: 912ae042    	add	x2, x2, #0xab8
102ab5804: aa1703e1    	mov	x1, x23
102ab5808: 9465f00f    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102ab580c: aa1d03fd    	mov	x29, x29
102ab5810: 9465f037    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102ab5814: aa0003f7    	mov	x23, x0
102ab5818: aa1803e0    	mov	x0, x24
102ab581c: 9465f025    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5820: aa1703f8    	mov	x24, x23
102ab5824: 14000007    	b	0x102ab5840 <_CMa03SUie28mjv+0x50408>
102ab5828: d2800017    	mov	x23, #0x0               ; =0
102ab582c: aa1503e0    	mov	x0, x21
102ab5830: 9465ec3c    	bl	0x104430920 <dyld_stub_binder+0x104430920>
102ab5834: 14000015    	b	0x102ab5888 <_CMa03SUie28mjv+0x50450>
102ab5838: b00153e8    	adrp	x8, 0x105532000 <dyld_stub_binder+0x105532000>
102ab583c: f9446d1f    	ldr	xzr, [x8, #0x8d8]
102ab5840: f90003f8    	str	x24, [sp]
102ab5844: b00164c0    	adrp	x0, 0x10574e000 <dyld_stub_binder+0x10574e000>
102ab5848: 912b6000    	add	x0, x0, #0xad8
102ab584c: 9465e2bd    	bl	0x10442e340 <dyld_stub_binder+0x10442e340>
102ab5850: aa1803e0    	mov	x0, x24
102ab5854: 9465f017    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5858: 12000b48    	and	w8, w26, #0x7
102ab585c: 11009508    	add	w8, w8, #0x25
102ab5860: 2a480508    	orr	w8, w8, w8, lsr #1
102ab5864: 2a480908    	orr	w8, w8, w8, lsr #2
102ab5868: 2a481108    	orr	w8, w8, w8, lsr #4
102ab586c: 2a482108    	orr	w8, w8, w8, lsr #8
102ab5870: 2a484108    	orr	w8, w8, w8, lsr #16
102ab5874: 7100fd1f    	cmp	w8, #0x3f
102ab5878: 54000061    	b.ne	0x102ab5884 <_CMa03SUie28mjv+0x5044c>
102ab587c: aa1503e0    	mov	x0, x21
102ab5880: 9465f00c    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5884: d2800017    	mov	x23, #0x0               ; =0
102ab5888: aa1603e0    	mov	x0, x22
102ab588c: 97ff972d    	bl	0x102a9b540 <_CMa03SUie28mjv+0x36108>
102ab5890: aa1403e0    	mov	x0, x20
102ab5894: 9465f007    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab5898: aa1303e0    	mov	x0, x19
102ab589c: 9465f005    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102ab58a0: aa1703e0    	mov	x0, x23
102ab58a4: a94a7bfd    	ldp	x29, x30, [sp, #0xa0]
102ab58a8: a9494ff4    	ldp	x20, x19, [sp, #0x90]
102ab58ac: a94857f6    	ldp	x22, x21, [sp, #0x80]
102ab58b0: a9475ff8    	ldp	x24, x23, [sp, #0x70]
102ab58b4: a94667fa    	ldp	x26, x25, [sp, #0x60]
102ab58b8: a9456ffc    	ldp	x28, x27, [sp, #0x50]
102ab58bc: 9102c3ff    	add	sp, sp, #0xb0
102ab58c0: 1465efa2    	b	0x104431748 <dyld_stub_binder+0x104431748>

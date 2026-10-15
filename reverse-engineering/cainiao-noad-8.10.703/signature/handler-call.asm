
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aa973c: d10203ff    	sub	sp, sp, #0x80
102aa9740: a90367fa    	stp	x26, x25, [sp, #0x30]
102aa9744: a9045ff8    	stp	x24, x23, [sp, #0x40]
102aa9748: a90557f6    	stp	x22, x21, [sp, #0x50]
102aa974c: a9064ff4    	stp	x20, x19, [sp, #0x60]
102aa9750: a9077bfd    	stp	x29, x30, [sp, #0x70]
102aa9754: 9101c3fd    	add	x29, sp, #0x70
102aa9758: aa0503f3    	mov	x19, x5
102aa975c: aa0403f4    	mov	x20, x4
102aa9760: aa0303fa    	mov	x26, x3
102aa9764: aa0203f6    	mov	x22, x2
102aa9768: aa0103f7    	mov	x23, x1
102aa976c: aa0003f8    	mov	x24, x0
102aa9770: d0014888    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102aa9774: f9438d08    	ldr	x8, [x8, #0x718]
102aa9778: f9400108    	ldr	x8, [x8]
102aa977c: f90017e8    	str	x8, [sp, #0x28]
102aa9780: 52800828    	mov	w8, #0x41               ; =65
102aa9784: b90007e8    	str	w8, [sp, #0x4]
102aa9788: 910013e8    	add	x8, sp, #0x4
102aa978c: 10000035    	adr	x21, 0x102aa9790 <_CMa03SUie28mjv+0x44358>
102aa9790: 980000ec    	ldrsw	x12, 0x102aa97ac <_CMa03SUie28mjv+0x44374>
102aa9794: aa2c03ec    	mvn	x12, x12
102aa9798: b9800119    	ldrsw	x25, [x8]
102aa979c: ca19018c    	eor	x12, x12, x25
102aa97a0: 8b0c02b5    	add	x21, x21, x12
102aa97a4: d2801128    	mov	x8, #0x89               ; =137
102aa97a8: d61f02a0    	br	x21
102aa97ac: ffffff8e    	<unknown>
102aa97b0: 0b825241    	add	w1, w18, w2, asr #20
102aa97b4: 74231418    	<unknown>
102aa97b8: 219a21a6    	<unknown>
102aa97bc: 396131d7    	ldrb	w23, [x14, #0x84c]
102aa97c0: b90017ff    	str	wzr, [sp, #0x14]
102aa97c4: 39004fff    	strb	wzr, [sp, #0x13]
102aa97c8: 7100551f    	cmp	w8, #0x15
102aa97cc: 540002a0    	b.eq	0x102aa9820 <_CMa03SUie28mjv+0x443e8>
102aa97d0: 5284e209    	mov	w9, #0x2710             ; =10000
102aa97d4: 52800c8a    	mov	w10, #0x64              ; =100
102aa97d8: 1b0a7eea    	mul	w10, w23, w10
102aa97dc: 1b092b09    	madd	w9, w24, w9, w10
102aa97e0: 0b160129    	add	w9, w9, w22
102aa97e4: 5282900a    	mov	w10, #0x1480            ; =5248
102aa97e8: 72a07dea    	movk	w10, #0x3ef, lsl #16
102aa97ec: 0b0a0120    	add	w0, w9, w10
102aa97f0: 93407d08    	sxtw	x8, w8
102aa97f4: 52801129    	mov	w9, #0x89               ; =137
102aa97f8: ca090108    	eor	x8, x8, x9
102aa97fc: 910063e9    	add	x9, sp, #0x18
102aa9800: 8b081122    	add	x2, x9, x8, lsl #4
102aa9804: a901cff4    	stp	x20, x19, [sp, #0x18]
102aa9808: 91004fe3    	add	x3, sp, #0x13
102aa980c: 910053e4    	add	x4, sp, #0x14
102aa9810: aa1a03e1    	mov	x1, x26
102aa9814: 940058b6    	bl	0x102abfaec <_CMa03SUie28mjv+0x5a6b4>
102aa9818: 39404fe8    	ldrb	w8, [sp, #0x13]
102aa981c: 35000408    	cbnz	w8, 0x102aa989c <_CMa03SUie28mjv+0x44464>
102aa9820: d001f268    	adrp	x8, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa9824: 913a8108    	add	x8, x8, #0xea0
102aa9828: f90007ff    	str	xzr, [sp, #0x8]
102aa982c: d001f269    	adrp	x9, 0x1068f7000 <dyld_stub_binder+0x1068f7000>
102aa9830: 913aa129    	add	x9, x9, #0xea8
102aa9834: 7100035f    	cmp	w26, #0x0
102aa9838: 9a890108    	csel	x8, x8, x9, eq
102aa983c: f9400115    	ldr	x21, [x8]
102aa9840: b001ded9    	adrp	x25, 0x106682000 <_OBJC_EHTYPE_$_NSError+0x15ebd0>
102aa9844: 910f8339    	add	x25, x25, #0x3e0
102aa9848: aa1903e0    	mov	x0, x25
102aa984c: 9466214e    	bl	0x104431d84 <dyld_stub_binder+0x104431d84>
102aa9850: 910023e5    	add	x5, sp, #0x8
102aa9854: aa1503e0    	mov	x0, x21
102aa9858: aa1803e1    	mov	x1, x24
102aa985c: aa1703e2    	mov	x2, x23
102aa9860: aa1603e3    	mov	x3, x22
102aa9864: 52800004    	mov	w4, #0x0                ; =0
102aa9868: 97fffec5    	bl	0x102aa937c <_CMa03SUie28mjv+0x43f44>
102aa986c: aa0003f5    	mov	x21, x0
102aa9870: aa1903e0    	mov	x0, x25
102aa9874: 9466214d    	bl	0x104431da8 <dyld_stub_binder+0x104431da8>
102aa9878: 340000b5    	cbz	w21, 0x102aa988c <_CMa03SUie28mjv+0x44454>
102aa987c: d2800000    	mov	x0, #0x0                ; =0
102aa9880: b40000f3    	cbz	x19, 0x102aa989c <_CMa03SUie28mjv+0x44464>
102aa9884: b9000275    	str	w21, [x19]
102aa9888: 14000005    	b	0x102aa989c <_CMa03SUie28mjv+0x44464>
102aa988c: f94007e8    	ldr	x8, [sp, #0x8]
102aa9890: aa1403e0    	mov	x0, x20
102aa9894: aa1303e1    	mov	x1, x19
102aa9898: d63f0100    	blr	x8
102aa989c: f94017e8    	ldr	x8, [sp, #0x28]
102aa98a0: d0014889    	adrp	x9, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102aa98a4: f9438d29    	ldr	x9, [x9, #0x718]
102aa98a8: f9400129    	ldr	x9, [x9]
102aa98ac: eb08013f    	cmp	x9, x8
102aa98b0: 54000101    	b.ne	0x102aa98d0 <_CMa03SUie28mjv+0x44498>
102aa98b4: a9477bfd    	ldp	x29, x30, [sp, #0x70]
102aa98b8: a9464ff4    	ldp	x20, x19, [sp, #0x60]
102aa98bc: a94557f6    	ldp	x22, x21, [sp, #0x50]
102aa98c0: a9445ff8    	ldp	x24, x23, [sp, #0x40]
102aa98c4: a94367fa    	ldp	x26, x25, [sp, #0x30]
102aa98c8: 910203ff    	add	sp, sp, #0x80
102aa98cc: d65f03c0    	ret
102aa98d0: 97bc71d2    	bl	0x1019c6018 <__ZN5hmdBU10async_safe11linked_listI22hmdBU_async_dict_entryE4nextEPNS3_4nodeE+0x5168>

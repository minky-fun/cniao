
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aaf54c: 17ffbdd2    	b	0x102a9ec94 <_CMa03SUie28mjv+0x3985c>
102aaf550: a9bd57f6    	stp	x22, x21, [sp, #-0x30]!
102aaf554: a9014ff4    	stp	x20, x19, [sp, #0x10]
102aaf558: a9027bfd    	stp	x29, x30, [sp, #0x20]
102aaf55c: 910083fd    	add	x29, sp, #0x20
102aaf560: aa0103f5    	mov	x21, x1
102aaf564: 29404c08    	ldp	w8, w19, [x0]
102aaf568: aa0803e0    	mov	x0, x8
102aaf56c: 97ffbdca    	bl	0x102a9ec94 <_CMa03SUie28mjv+0x3985c>
102aaf570: aa0003f4    	mov	x20, x0
102aaf574: b40000f5    	cbz	x21, 0x102aaf590 <_CMa03SUie28mjv+0x4a158>
102aaf578: b94002a8    	ldr	w8, [x21]
102aaf57c: f100029f    	cmp	x20, #0x0
102aaf580: 7a401900    	ccmp	w8, #0x0, #0x0, ne
102aaf584: 54000080    	b.eq	0x102aaf594 <_CMa03SUie28mjv+0x4a15c>
102aaf588: b5000114    	cbnz	x20, 0x102aaf5a8 <_CMa03SUie28mjv+0x4a170>
102aaf58c: 14000009    	b	0x102aaf5b0 <_CMa03SUie28mjv+0x4a178>


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102aaf65c: 52800020    	mov	w0, #0x1                ; =1
102aaf660: 52800121    	mov	w1, #0x9                ; =9
102aaf664: 52800042    	mov	w2, #0x2                ; =2
102aaf668: 52800003    	mov	w3, #0x0                ; =0
102aaf66c: d63f0100    	blr	x8
102aaf670: 52800013    	mov	w19, #0x0               ; =0
102aaf674: 350002e0    	cbnz	w0, 0x102aaf6d0 <_CMa03SUie28mjv+0x4a298>


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a9efc8: b9000fff    	str	wzr, [sp, #0xc]
102a9efcc: 71028e9f    	cmp	w20, #0xa3
102a9efd0: 54000143    	b.lo	0x102a9eff8 <_CMa03SUie28mjv+0x39bc0>
102a9efd4: d2800000    	mov	x0, #0x0                ; =0
102a9efd8: 52800028    	mov	w8, #0x1                ; =1
102a9efdc: b9000fe8    	str	w8, [sp, #0xc]
102a9efe0: b40001b3    	cbz	x19, 0x102a9f014 <_CMa03SUie28mjv+0x39bdc>
102a9efe4: f0015488    	adrp	x8, 0x105531000 <dyld_stub_binder+0x105531000>
102a9efe8: f944111f    	ldr	xzr, [x8, #0x820]
102a9efec: b9400fe8    	ldr	w8, [sp, #0xc]
102a9eff0: b9000268    	str	w8, [x19]
102a9eff4: 1400000a    	b	0x102a9f01c <_CMa03SUie28mjv+0x39be4>
102a9eff8: f0015488    	adrp	x8, 0x105531000 <dyld_stub_binder+0x105531000>
102a9effc: 9120e108    	add	x8, x8, #0x838
102a9f000: 8b345108    	add	x8, x8, w20, uxtw #4
102a9f004: a9400109    	ldp	x9, x0, [x8]
102a9f008: 910033e1    	add	x1, sp, #0xc
102a9f00c: d63f0120    	blr	x9
102a9f010: b5fffeb3    	cbnz	x19, 0x102a9efe4 <_CMa03SUie28mjv+0x39bac>
102a9f014: d0015488    	adrp	x8, 0x105531000 <dyld_stub_binder+0x105531000>
102a9f018: f9440d1f    	ldr	xzr, [x8, #0x818]
102a9f01c: a9447bfd    	ldp	x29, x30, [sp, #0x40]
102a9f020: a9434ff4    	ldp	x20, x19, [sp, #0x30]
102a9f024: a94257f6    	ldp	x22, x21, [sp, #0x20]
102a9f028: a9416ffc    	ldp	x28, x27, [sp, #0x10]
102a9f02c: 910143ff    	add	sp, sp, #0x50
102a9f030: d65f03c0    	ret
102a9f034: d10083ff    	sub	sp, sp, #0x20


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102a791f4: a9bd57f6    	stp	x22, x21, [sp, #-0x30]!
102a791f8: a9014ff4    	stp	x20, x19, [sp, #0x10]
102a791fc: a9027bfd    	stp	x29, x30, [sp, #0x20]
102a79200: 910083fd    	add	x29, sp, #0x20
102a79204: 9001f3f3    	adrp	x19, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102a79208: 397eb668    	ldrb	w8, [x19, #0xfad]
102a7920c: 370001a8    	tbnz	w8, #0x0, 0x102a79240 <_CMa03SUie28mjv+0x13e08>
102a79210: 9001f3e0    	adrp	x0, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102a79214: 913eb800    	add	x0, x0, #0xfae
102a79218: 9000ed42    	adrp	x2, 0x104821000 <dyld_stub_binder+0x104821000>
102a7921c: 911ef042    	add	x2, x2, #0x7bc
102a79220: 9000ed63    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102a79224: 9126c063    	add	x3, x3, #0x9b0
102a79228: 528002a1    	mov	w1, #0x15               ; =21
102a7922c: 52800084    	mov	w4, #0x4                ; =4
102a79230: 52801025    	mov	w5, #0x81               ; =129
102a79234: 9466d2ed    	bl	0x10442dde8 <dyld_stub_binder+0x10442dde8>
102a79238: 52800028    	mov	w8, #0x1                ; =1
102a7923c: 393eb668    	strb	w8, [x19, #0xfad]
102a79240: 9001f3f3    	adrp	x19, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102a79244: 397f0e68    	ldrb	w8, [x19, #0xfc3]
102a79248: 370001a8    	tbnz	w8, #0x0, 0x102a7927c <_CMa03SUie28mjv+0x13e44>
102a7924c: 9001f3e0    	adrp	x0, 0x1068f5000 <dyld_stub_binder+0x1068f5000>
102a79250: 913f1000    	add	x0, x0, #0xfc4
102a79254: 9000ed42    	adrp	x2, 0x104821000 <dyld_stub_binder+0x104821000>
102a79258: 911f4442    	add	x2, x2, #0x7d1
102a7925c: 9000ed43    	adrp	x3, 0x104821000 <dyld_stub_binder+0x104821000>
102a79260: 911fa863    	add	x3, x3, #0x7ea
102a79264: 52800321    	mov	w1, #0x19               ; =25
102a79268: 52800064    	mov	w4, #0x3                ; =3
102a7926c: 52800e25    	mov	w5, #0x71               ; =113
102a79270: 9466d2d8    	bl	0x10442ddd0 <dyld_stub_binder+0x10442ddd0>
102a79274: 52800028    	mov	w8, #0x1                ; =1
102a79278: 393f0e68    	strb	w8, [x19, #0xfc3]
102a7927c: 900166b3    	adrp	x19, 0x10574d000 <dyld_stub_binder+0x10574d000>
102a79280: 913de273    	add	x19, x19, #0xf78
102a79284: aa1303e0    	mov	x0, x19
102a79288: 9466d41c    	bl	0x10442e2f8 <dyld_stub_binder+0x10442e2f8>
102a7928c: 900166a8    	adrp	x8, 0x10574d000 <dyld_stub_binder+0x10574d000>
102a79290: 913e6108    	add	x8, x8, #0xf98
102a79294: f100001f    	cmp	x0, #0x0
102a79298: 9a930100    	csel	x0, x8, x19, eq
102a7929c: 9466d417    	bl	0x10442e2f8 <dyld_stub_binder+0x10442e2f8>
102a792a0: b40002e0    	cbz	x0, 0x102a792fc <_CMa03SUie28mjv+0x13ec4>
102a792a4: aa0003e2    	mov	x2, x0
102a792a8: d001c1c8    	adrp	x8, 0x1062b3000 <dyld_stub_binder+0x1062b3000>
102a792ac: f942b900    	ldr	x0, [x8, #0x570]
102a792b0: d001bca8    	adrp	x8, 0x10620f000 <dyld_stub_binder+0x10620f000>
102a792b4: f9467901    	ldr	x1, [x8, #0xcf0]
102a792b8: 9466e163    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102a792bc: aa1d03fd    	mov	x29, x29
102a792c0: 9466e18b    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102a792c4: aa0003f3    	mov	x19, x0
102a792c8: d001bca8    	adrp	x8, 0x10620f000 <dyld_stub_binder+0x10620f000>
102a792cc: f9468901    	ldr	x1, [x8, #0xd10]
102a792d0: 9466e15d    	bl	0x104431844 <dyld_stub_binder+0x104431844>
102a792d4: aa1d03fd    	mov	x29, x29
102a792d8: 9466e185    	bl	0x1044318ec <dyld_stub_binder+0x1044318ec>
102a792dc: aa0003f4    	mov	x20, x0
102a792e0: 94010459    	bl	0x102aba444 <_CMa03SUie28mjv+0x5500c>
102a792e4: aa0003f5    	mov	x21, x0
102a792e8: aa1403e0    	mov	x0, x20
102a792ec: 9466e171    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102a792f0: aa1303e0    	mov	x0, x19
102a792f4: 9466e16f    	bl	0x1044318b0 <dyld_stub_binder+0x1044318b0>
102a792f8: aa1503e0    	mov	x0, x21
102a792fc: a9427bfd    	ldp	x29, x30, [sp, #0x20]
102a79300: a9414ff4    	ldp	x20, x19, [sp, #0x10]
102a79304: a8c357f6    	ldp	x22, x21, [sp], #0x30
102a79308: d65f03c0    	ret
102a7930c: d100c3ff    	sub	sp, sp, #0x30

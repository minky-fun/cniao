
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102b2c484 <_CMi03Zt2QbtMER>:
102b3d39c: d102c3ff    	sub	sp, sp, #0xb0
102b3d3a0: a9066ffc    	stp	x28, x27, [sp, #0x60]
102b3d3a4: a90767fa    	stp	x26, x25, [sp, #0x70]
102b3d3a8: a90857f6    	stp	x22, x21, [sp, #0x80]
102b3d3ac: a9094ff4    	stp	x20, x19, [sp, #0x90]
102b3d3b0: a90a7bfd    	stp	x29, x30, [sp, #0xa0]
102b3d3b4: 910283fd    	add	x29, sp, #0xa0
102b3d3b8: aa0103f3    	mov	x19, x1
102b3d3bc: aa0003f5    	mov	x21, x0
102b3d3c0: d00143e8    	adrp	x8, 0x1053bb000 <dyld_stub_binder+0x1053bb000>
102b3d3c4: f9438d08    	ldr	x8, [x8, #0x718]
102b3d3c8: f9400108    	ldr	x8, [x8]
102b3d3cc: f81b83a8    	stur	x8, [x29, #-0x48]
102b3d3d0: 528006a8    	mov	w8, #0x35               ; =53
102b3d3d4: b90007e8    	str	w8, [sp, #0x4]
102b3d3d8: 910023e8    	add	x8, sp, #0x8
102b3d3dc: 910013e9    	add	x9, sp, #0x4
102b3d3e0: 10000027    	adr	x7, 0x102b3d3e4 <_CMi03Zt2QbtMER+0x10f60>
102b3d3e4: 9800015a    	ldrsw	x26, 0x102b3d40c <_CMi03Zt2QbtMER+0x10f88>
102b3d3e8: aa3a03fa    	mvn	x26, x26
102b3d3ec: aa3a03fa    	mvn	x26, x26
102b3d3f0: 9102bb5a    	add	x26, x26, #0xae
102b3d3f4: b9800125    	ldrsw	x5, [x9]
102b3d3f8: 8b05035a    	add	x26, x26, x5
102b3d3fc: 8b1a00e7    	add	x7, x7, x26
102b3d400: 528000f0    	mov	w16, #0x7               ; =7
102b3d404: b9000110    	str	w16, [x8]
102b3d408: d61f00e0    	br	x7
102b3d40c: ffffff59    	<unknown>
102b3d410: ba73439a    	<unknown>
102b3d414: 219d051f    	<unknown>
102b3d418: c1560291    	fmls	za.s[w8, 1, vgx2], { z20.s, z21.s }, z6.s[0]
102b3d41c: ff7fbd2c    	<unknown>
102b3d420: b9400be8    	ldr	w8, [sp, #0x8]
102b3d424: d001edf4    	adrp	x20, 0x1068fb000 <dyld_stub_binder+0x1068fb000>
102b3d428: 3952d289    	ldrb	w9, [x20, #0x4b4]
102b3d42c: 7103951f    	cmp	w8, #0xe5
102b3d430: 7a40d924    	ccmp	w9, #0x0, #0x4, le
102b3d434: 540001a1    	b.ne	0x102b3d468 <_CMi03Zt2QbtMER+0x10fe4>
102b3d438: d001ede0    	adrp	x0, 0x1068fb000 <dyld_stub_binder+0x1068fb000>
102b3d43c: 9112d400    	add	x0, x0, #0x4b5
102b3d440: b000e742    	adrp	x2, 0x104826000 <dyld_stub_binder+0x104826000>
102b3d444: 91134842    	add	x2, x2, #0x4d2
102b3d448: 9000e743    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102b3d44c: 91265063    	add	x3, x3, #0x994
102b3d450: 528000c1    	mov	w1, #0x6                ; =6
102b3d454: 52800084    	mov	w4, #0x4                ; =4
102b3d458: 528012e5    	mov	w5, #0x97               ; =151
102b3d45c: 9463c26c    	bl	0x10442de0c <dyld_stub_binder+0x10442de0c>
102b3d460: 52800028    	mov	w8, #0x1                ; =1
102b3d464: 3912d288    	strb	w8, [x20, #0x4b4]
102b3d468: d001edf4    	adrp	x20, 0x1068fb000 <dyld_stub_binder+0x1068fb000>
102b3d46c: 3952ee88    	ldrb	w8, [x20, #0x4bb]
102b3d470: 370001a8    	tbnz	w8, #0x0, 0x102b3d4a4 <_CMi03Zt2QbtMER+0x11020>
102b3d474: d001ede0    	adrp	x0, 0x1068fb000 <dyld_stub_binder+0x1068fb000>
102b3d478: 9112f000    	add	x0, x0, #0x4bc
102b3d47c: d000e742    	adrp	x2, 0x104827000 <dyld_stub_binder+0x104827000>
102b3d480: 913c6042    	add	x2, x2, #0xf18
102b3d484: 9000e743    	adrp	x3, 0x104825000 <dyld_stub_binder+0x104825000>
102b3d488: 91266063    	add	x3, x3, #0x998
102b3d48c: 52800081    	mov	w1, #0x4                ; =4
102b3d490: 52800084    	mov	w4, #0x4                ; =4
102b3d494: 52800f25    	mov	w5, #0x79               ; =121
102b3d498: 9463c257    	bl	0x10442ddf4 <dyld_stub_binder+0x10442ddf4>
102b3d49c: 52800028    	mov	w8, #0x1                ; =1
102b3d4a0: 3912ee88    	strb	w8, [x20, #0x4bb]
102b3d4a4: b001da80    	adrp	x0, 0x10668e000 <_OBJC_EHTYPE_$_NSError+0x16abd0>
102b3d4a8: 91128000    	add	x0, x0, #0x4a0
102b3d4ac: 9463d218    	bl	0x104431d0c <dyld_stub_binder+0x104431d0c>
102b3d4b0: b4000ab5    	cbz	x21, 0x102b3d604 <_CMi03Zt2QbtMER+0x11180>
102b3d4b4: f94002b4    	ldr	x20, [x21]
102b3d4b8: b4000a94    	cbz	x20, 0x102b3d608 <_CMi03Zt2QbtMER+0x11184>
102b3d4bc: f94006a8    	ldr	x8, [x21, #0x8]
102b3d4c0: b4000a48    	cbz	x8, 0x102b3d608 <_CMi03Zt2QbtMER+0x11184>
102b3d4c4: a904a3f4    	stp	x20, x8, [sp, #0x48]
102b3d4c8: 528014a8    	mov	w8, #0xa5               ; =165
102b3d4cc: b90017e8    	str	w8, [sp, #0x14]
102b3d4d0: 910053e8    	add	x8, sp, #0x14
102b3d4d4: 10000025    	adr	x5, 0x102b3d4d8 <_CMi03Zt2QbtMER+0x11054>
102b3d4d8: 980000cd    	ldrsw	x13, 0x102b3d4f0 <_CMi03Zt2QbtMER+0x1106c>
102b3d4dc: b980011b    	ldrsw	x27, [x8]
102b3d4e0: cb1b01ad    	sub	x13, x13, x27
102b3d4e4: 8b0d00a5    	add	x5, x5, x13
102b3d4e8: d28013e8    	mov	x8, #0x9f               ; =159
102b3d4ec: d61f00a0    	br	x5
102b3d4f0: 000000d1    	udf	#0xd1
102b3d4f4: 2be47d30    	<unknown>
102b3d4f8: 78a0fc92    	<unknown>
102b3d4fc: 079a712b    	<unknown>
102b3d500: 028972d1    	<unknown>
102b3d504: 9001ee08    	adrp	x8, 0x1068fd000 <dyld_stub_binder+0x1068fd000>
102b3d508: f9434908    	ldr	x8, [x8, #0x690]
102b3d50c: f9400908    	ldr	x8, [x8, #0x10]
102b3d510: 910123e4    	add	x4, sp, #0x48
102b3d514: 528000e0    	mov	w0, #0x7                ; =7
102b3d518: 52800021    	mov	w1, #0x1                ; =1
102b3d51c: 52800042    	mov	w2, #0x2                ; =2
102b3d520: 52800003    	mov	w3, #0x0                ; =0
102b3d524: aa1303e5    	mov	x5, x19
102b3d528: d63f0100    	blr	x8
102b3d52c: aa0003f5    	mov	x21, x0

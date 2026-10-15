
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102abf384: a9be4ff4    	stp	x20, x19, [sp, #-0x20]!
102abf388: a9017bfd    	stp	x29, x30, [sp, #0x10]
102abf38c: 910043fd    	add	x29, sp, #0x10
102abf390: b40001a0    	cbz	x0, 0x102abf3c4 <_CMa03SUie28mjv+0x59f8c>
102abf394: aa0003f4    	mov	x20, x0
102abf398: b9400808    	ldr	w8, [x0, #0x8]
102abf39c: 11000500    	add	w0, w8, #0x1
102abf3a0: 94000069    	bl	0x102abf544 <_CMa03SUie28mjv+0x5a10c>
102abf3a4: aa0003f3    	mov	x19, x0
102abf3a8: b4000100    	cbz	x0, 0x102abf3c8 <_CMa03SUie28mjv+0x59f90>
102abf3ac: f9400a68    	ldr	x8, [x19, #0x10]
102abf3b0: f9400281    	ldr	x1, [x20]
102abf3b4: b9400a82    	ldr	w2, [x20, #0x8]
102abf3b8: aa1303e0    	mov	x0, x19
102abf3bc: d63f0100    	blr	x8
102abf3c0: 14000002    	b	0x102abf3c8 <_CMa03SUie28mjv+0x59f90>
102abf3c4: d2800013    	mov	x19, #0x0               ; =0
102abf3c8: aa1303e0    	mov	x0, x19
102abf3cc: a9417bfd    	ldp	x29, x30, [sp, #0x10]
102abf3d0: a8c24ff4    	ldp	x20, x19, [sp], #0x20
102abf3d4: d65f03c0    	ret
102abf3d8: a9be4ff4    	stp	x20, x19, [sp, #-0x20]!


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102abf544: a9bd57f6    	stp	x22, x21, [sp, #-0x30]!
102abf548: a9014ff4    	stp	x20, x19, [sp, #0x10]
102abf54c: a9027bfd    	stp	x29, x30, [sp, #0x20]
102abf550: 910083fd    	add	x29, sp, #0x20
102abf554: 7100041f    	cmp	w0, #0x1
102abf558: 540006eb    	b.lt	0x102abf634 <_CMa03SUie28mjv+0x5a1fc>
102abf55c: aa0003f4    	mov	x20, x0
102abf560: 52800d00    	mov	w0, #0x68               ; =104
102abf564: 9465c78f    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102abf568: aa0003f3    	mov	x19, x0
102abf56c: b4000660    	cbz	x0, 0x102abf638 <_CMa03SUie28mjv+0x5a200>
102abf570: 4f00e400    	movi.16b	v0, #0x0
102abf574: 3c808260    	stur	q0, [x19, #0x8]
102abf578: 3c858260    	stur	q0, [x19, #0x58]
102abf57c: 3c848260    	stur	q0, [x19, #0x48]
102abf580: 3c838260    	stur	q0, [x19, #0x38]
102abf584: 3c828260    	stur	q0, [x19, #0x28]
102abf588: 3c818260    	stur	q0, [x19, #0x18]
102abf58c: b9000e74    	str	w20, [x19, #0xc]
102abf590: 2a1403f4    	mov	w20, w20
102abf594: f900027f    	str	xzr, [x19]
102abf598: aa1403e0    	mov	x0, x20
102abf59c: 9465c781    	bl	0x1044313a0 <dyld_stub_binder+0x1044313a0>
102abf5a0: b4000460    	cbz	x0, 0x102abf62c <_CMa03SUie28mjv+0x5a1f4>
102abf5a4: aa0003f5    	mov	x21, x0
102abf5a8: aa1403e1    	mov	x1, x20
102abf5ac: 9465c342    	bl	0x1044302b4 <dyld_stub_binder+0x1044302b4>
102abf5b0: f9000275    	str	x21, [x19]
102abf5b4: 10ffe028    	adr	x8, 0x102abf1b8 <_CMa03SUie28mjv+0x59d80>
102abf5b8: d503201f    	nop
102abf5bc: 10ffe529    	adr	x9, 0x102abf260 <_CMa03SUie28mjv+0x59e28>
102abf5c0: d503201f    	nop
102abf5c4: a9022668    	stp	x8, x9, [x19, #0x20]
102abf5c8: 10ffe668    	adr	x8, 0x102abf294 <_CMa03SUie28mjv+0x59e5c>
102abf5cc: d503201f    	nop
102abf5d0: 10ffe849    	adr	x9, 0x102abf2d8 <_CMa03SUie28mjv+0x59ea0>
102abf5d4: d503201f    	nop
102abf5d8: a9032668    	stp	x8, x9, [x19, #0x30]
102abf5dc: 10ffe9e8    	adr	x8, 0x102abf318 <_CMa03SUie28mjv+0x59ee0>
102abf5e0: d503201f    	nop
102abf5e4: 10ffed09    	adr	x9, 0x102abf384 <_CMa03SUie28mjv+0x59f4c>
102abf5e8: d503201f    	nop
102abf5ec: a9042668    	stp	x8, x9, [x19, #0x40]
102abf5f0: 10ffda48    	adr	x8, 0x102abf138 <_CMa03SUie28mjv+0x59d00>
102abf5f4: d503201f    	nop
102abf5f8: 10ffef09    	adr	x9, 0x102abf3d8 <_CMa03SUie28mjv+0x59fa0>
102abf5fc: d503201f    	nop
102abf600: a9012668    	stp	x8, x9, [x19, #0x10]
102abf604: 10fff188    	adr	x8, 0x102abf434 <_CMa03SUie28mjv+0x59ffc>
102abf608: d503201f    	nop
102abf60c: 10fff249    	adr	x9, 0x102abf454 <_CMa03SUie28mjv+0x5a01c>
102abf610: d503201f    	nop
102abf614: b9000a7f    	str	wzr, [x19, #0x8]
102abf618: a9052668    	stp	x8, x9, [x19, #0x50]
102abf61c: 10fff308    	adr	x8, 0x102abf47c <_CMa03SUie28mjv+0x5a044>
102abf620: d503201f    	nop
102abf624: f9003268    	str	x8, [x19, #0x60]
102abf628: 14000004    	b	0x102abf638 <_CMa03SUie28mjv+0x5a200>
102abf62c: aa1303e0    	mov	x0, x19
102abf630: 9465c4bc    	bl	0x104430920 <dyld_stub_binder+0x104430920>
102abf634: d2800013    	mov	x19, #0x0               ; =0
102abf638: aa1303e0    	mov	x0, x19
102abf63c: a9427bfd    	ldp	x29, x30, [sp, #0x20]
102abf640: a9414ff4    	ldp	x20, x19, [sp, #0x10]
102abf644: a8c357f6    	ldp	x22, x21, [sp], #0x30

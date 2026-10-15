
Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ab5464: aa0503f6    	mov	x22, x5
102ab5468: aa0403f5    	mov	x21, x4
102ab546c: aa0303f3    	mov	x19, x3
102ab5470: aa0203f8    	mov	x24, x2
102ab5474: aa0003f7    	mov	x23, x0


Cainiao4iPhone:	file format mach-o arm64

Disassembly of section __TEXT,__text:

0000000102a65438 <_CMa03SUie28mjv>:
102ab566c: f90017f6    	str	x22, [sp, #0x28]
102ab5670: f0015908    	adrp	x8, 0x1055d8000 <dyld_stub_binder+0x1055d8000>
102ab5674: 9123e108    	add	x8, x8, #0x8f8
102ab5678: f100027f    	cmp	x19, #0x0
102ab567c: 9a930100    	csel	x0, x8, x19, eq
102ab5680: 9465f095    	bl	0x1044318d4 <dyld_stub_binder+0x1044318d4>
102ab5684: f001bac8    	adrp	x8, 0x106210000 <dyld_stub_binder+0x106210000>
102ab5688: f9421117    	ldr	x23, [x8, #0x420]
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

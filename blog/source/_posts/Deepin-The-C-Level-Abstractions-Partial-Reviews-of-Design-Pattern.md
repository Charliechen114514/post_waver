---
title: "Deepin The C Level Abstractions: Partial Reviews of Design Pattern"
date: 2025-02-27
---

# 深入讨论C语言的可能抽象：部分对设计模式的思考

​非常感谢大爹[C语言抽象-实践trait \| Dessera Lab](https://dessera.github.io/article/3acise8k/)的文章，这个问题是我先前询问过的，我们如何在C语言中做我们熟悉的更加"高级"的语言中可能的抽象呢？

​我们知道：使用C语言进行编程的人，大部分都是面向嵌入式设备（底层设备），或者是面向底层场景（操作系统/高性能）进行编程。其内存资源，算力资源相对于我们的需求而言，谈不上富裕。过多的冗杂的抽象（比如说Jvav），并不适用于这里。这里的抽象更加的自由（甚至可以说是基本没有约束），可以更好的发挥各位程序员的才华。所以，笔者打算在这里，复盘和斗胆讨论一下使用C语言完成的可能契合场景的抽象。

## 评估DIP原则

> 抽象是一种很常见的代码工程技巧，其最根本的目的就是代码复用，笔者看来，它最重要也是唯一的准则就是：依赖接口，而不是实现。

​的确，我们需要知道的是：计算机的编程本质上是人基于自己的抽象认知完成对客观世界的建模。我们模仿客体的行为（或者说，反映我们的被抽象对象的状态，行为），来达到完成生产的需求的目的。中间显然涉及到了认识论的范畴。"依赖接口，而不是实现"作为**依赖倒置原则 (Dependency Inversion Principle, DIP)**成为不少人，甚至就是包括笔者展开对目标客体编程的一个重要准则。换而言之。

> 笔者认为，抽象本身无关乎语言，只要你尝试在一台满足图灵机的一台可编程的机器上，让他完成一些无论是具备高阶还是低阶的需求的时候，你本身就被纳入抽象过程的一环，**即------程序员的思考本身就是人在计算机中对建模建模的重要一环：也就是程序员是建立计算机抽象到现实抽象的桥梁。程序员如何根据现实生产在他身上的倒影完成抽象关乎到了我们综合评价一个抽象是否是在功利层次上说是------"好的抽象"**。或者说：不存在一个无关乎场景和人评价的完全最完美的抽象。**因为程序抽象总是关乎场景和基于场景的评价体系。**

​这看似有点远了，实则不然。**依赖接口完成对现实的建模恰恰满足了人的认识的流程，自然也就成为了软件工程规模达到了千万行的今天大家最青睐的一种准则。因为这是一种符合认识自然的认识论的计算机建模准则**。一个程序员不应该使用"实现"来完成模块的沟通，而是使用"接口"来完成沟通。不是向其他模块长篇大论自己如何工作，而是使用三两言，甚至有极端者，呼吁使用函数模块签名就完成自己协同其他模块的交流。这种看似颠倒了的软件工程发展的流程实际上是人日益对复杂现实建模的一种"无能为力"的妥协。**笔者自然也选择赞同在工程开发上，请务必在宏观层次多依赖接口思考，在实现微观上按照实现思考的准则**

> 注意，这个准则可以被递归到直到最小的原子化API。比如说细到操作系统抽象，比如说汇编语言抽象；也可以很大：大到若干成熟的网络通信模块，驱动子系统抽象模块，甚至是若干协作软件的抽象。这完全取决于"分层化"的设计中，我们身处于哪一环：这就是我所说的------我们没办法脱离于场景和基于场景的评价体系评价一个抽象。

## 争论语言的类型强弱

​必须承认，我们总是存在一部分争论的本质是双方达不成对同一客体的统一抽象，虽然关乎"人能不能认识到"物质"的本至"成为了一个经典非常经典的哲学议题。伴随计算机产业的爆发式发展，派生的现代软件工程的就是在解决一群协作的人能否达成对统一抽象的共同认识。关于此，一个底层的命题就是------C语言能完成诸如泛型等现代语言的抽象特征嘛？

> 有读者可能认为`C`是强类型语言，但笔者的观点是，只要该语言有类似`any`这样的类型，那么它就是弱类型语言，显然`void*`就是`C`语言中的`any`类型。

​我认为，这句话实际上缺乏了大量的条件，成为了非法的无从讨论的话题。或者说，讨论这个话题，需要满足我所说的------需要一个对类型强弱判别的一个场景之分。笔者斗胆下定一个结论：这两个statement都是正确的。我下面从两个层次上做分类。

#### 从编译器实现层次上谈论

> :warning:这个是笔者的暴论，笔者没有系统过编译器的实现

​从抽象自然的角度上来讲，或者说程序编写范畴给人带来的感触上，C语言毫无疑问的是一个强类型语言。你不可能按照一个自然的计算机层次抽象让最广泛的C编译器（GCC, Clang, MSVC等...）通过下面代码的编译

```text
int abuse_value = 1;
abuse_value = "Welp, this is an wrong code in C";
```

​使用GCC14.2，我们的编译器毫不客气的甩给我们一个错误。

```yaml
error: assignment to 'int' from 'char *' makes integer from pointer without a cast [-Wint-conversion]
    6 |     abuse_value = "Welp, this is an wrong code in C";
```

​但是对于Python，亦或者是Typical JS这种经典的弱类型语言而言，上述事情完全可以做到。

```python
➜  python
Python 3.12.9 | packaged by Anaconda, Inc. | (main, Feb  6 2025, 18:49:16) [MSC v.1929 64 bit (AMD64)] on win32
Type "help", "copyright", "credits" or "license" for more information.
>>> var = 1
>>> print(var)
1
>>> var = "But this can be in python"
>>> print(var)
But this can be in python
```

​从这个角度上来看，C这个语言，在广泛使用上，其类型检查和类型使用是完全强于Python或者是JS等经典弱类型语言。后者完全可以随心所欲的，甚至对于一些人可以是毫无章法的变换变量的类型。事实证明， 这类语言的经典弱类型对软件工程发展的今天起到了并不谈得上是正面的作用，不然，我们恐怕永远不会有辅助检查工具，类型标注技术和基于此发展的派生语言了（TypeScripts）

#### 从抽象自然角度

​抛开那些最强烈的钟爱于不变性，甚至一小部分对变化本身达到了一种近似于病态追求的语言，大部分的语言实际上都可以是弱类型的语言。因为，在面对客观实际的抽象层次上，我们的抽象客体：现实世界，总是在发生辩证运动的否定与否定之否定（笔者比较倾向于辩证唯物主义观点），我们总是不得不对我们维护的抽象的种类，发生一点小小的，或者是剧烈的变化。

1.  可以是架构设计失误导致的------这隶属于人对目标客体的认识发生了错误的认识，需要对抽象做出变革的时候，对整体架构必须实现颠覆性破坏的重构。

2.  可以是程序流模拟我们作为服务端一步一步认知现实客户端的需求时，其客体从宽泛的抽象类转向更加具体的实现类发生进步的认知提升。 获取可以主动可以被动，也就产生了静态的/先验的（我们主动的预设了类型的种类），也可以是动态的/后验的（我们在运行时动态裁决了类型）

```text
    -- I owns an animal     ->           Animal* A = new Animal; // this is enough
    --- I told you it's a cute pet ->     assert(dynamic_cast<Pet*>(A));   // process with information queried
    ---- Aha, u know what, that's a dog! -> \
        assert(dynamic_cast<Dog*>(dynamic_cast<Pet*>(A)));
```

3.  可以是发生接口转发时，将请求转发到满足那些**里氏替换原则**的接口完成高阶抽象服务的场景

```cpp
    // signatures of functions are placing here
    // forgive me using C++, I dislike making long abstractions... though it can be done also
    void Thread::depatch_worker(Runnable* _IRunnableInstance);
    ...

    Worker* MyWorker    = new Worker;  // which is defined as a derived class of Runnable
    Thread::current_thread()->depatch_worker(MyWorker);
```

4.  其他笔者可能遗漏的场景...

​这样看，面像需求和详细场景的时候，我们总是可以看到任何潜在的类型转化的场景。类型的严格与否，完全取决于我们的场景下，我们选取的度量尺度。在最一般的场景下，我们习惯认为C是一门强类型语言。对于需要让C做出妥协完成更加框架化的语言的功能的时候（比如说任何一个OOP编程语言的public/protected/private derivied或者是纯粹接口的concept等），我们不得不使用void*来传递我们的逻辑对象，事实证明------C语言作为一个相当纯粹的封装汇编语言，自身并不支持类型检查的语言，写这类抽象非常的费劲，近似于自由的Typical Python或者是Typical JavaScript。这时，我们下定论断，**只要该语言提供面像此类场景时，存在有类似`any`这样的类型的工具时，它就是弱类型语言**，显然\`void*`就是`C`语言中的`any\`类型。

## 回归对本篇文章目的的核心讨论------如何有效的使用C语言完成对场景编程的抽象呢？

​笔者进一步归纳一下[Dessera (Dessera)](https://github.com/Dessera)对C语言下常用的抽象手段，完备其讨论。

#### 静态多态------使用C语言的编译宏的静态多态技术

​这个技术实际上非常的**粗野**，倒不如说，两者的关系弱耦合到更加像是C语言的编译宏恰好可以完成这样的抽象工作。这类就如我所说的------静态的/先验的多态技术。

```c
#include <stdio.h>
#include <string.h>
typedef struct _IAnimalType{
    char animal_type[20];
}IAnimalType;

void createAnimal(IAnimalType* type){
#ifdef __INDICATE_AS_DOG
    strcpy(type->animal_type, "Hello, I'm Dog!");
#else
    strcpy(type->animal_type, "Hello, I'm Cat!");
#endif
}

int main()
{
    IAnimalType animal;
    createAnimal(&animal);
    printf("Animal Speaking: %s\n", animal.animal_type);
}
```

```text
gcc demo.c -o demo
./demo
Animal Speaking: Hello, I'm Cat!
gcc demo.c -D__INDICATE_AS_DOG -o demo
./demo
Animal Speaking: Hello, I'm Dog!
```

#### 动态多态------函数指针

​这是我习惯使用的抽象，但是笔者自己认为这样的抽象再面对一些场景（比如说笔者之前跟搞嵌入式的朋友聊天，他们的调用Deadline达到了一种病态要求的实时特性）的时候具备非常大的局限性。

​现在就来试一把！

```c
#include <stdio.h>
#include <string.h>

typedef enum {
    OLED,
    LCD,
    DEFAULT_PAINTABLE_DEVICE
}PaintableDeviceTypeEnum;

typedef struct __IPaintableDevice{
    void(*Draw)(struct __IPaintableDevice* device);
    PaintableDeviceTypeEnum holding_type;
}IPaintableDevice;

static void draw_oled(IPaintableDevice* device){
    if(device->holding_type != OLED){
        fprintf(stderr, "Hey! Mismatch Device!\n");
        return;
    }
    printf("Oh, I shell paint as if I'm OLED\n");
    return;
}

static void draw_lcd(IPaintableDevice* device){
    if(device->holding_type != LCD){
        fprintf(stderr, "Hey! Mismatch Device!\n");
        return;
    }
    printf("Oh, I shell paint as if I'm LCD\n");
    return;
}

static void draw_default_as_fallback(IPaintableDevice* device){
    if(device->holding_type != DEFAULT_PAINTABLE_DEVICE){
        fprintf(stderr, "Hey! Mismatch Device!\n");
        return;
    }
    printf("Oh, I shell paint as if I'm DEFAULT_PAINTABLE_DEVICE\n");
    return;   
}

void registerDevice(IPaintableDevice* device, const PaintableDeviceTypeEnum type_inferred){
    device->holding_type = type_inferred;
    switch(type_inferred)
    {
        case OLED:
            device->Draw = draw_oled;
        break;
        case LCD:
            device->Draw = draw_lcd;
        break;
        default:
            device->Draw = draw_default_as_fallback;
        break;
    }
}

int main()
{
    IPaintableDevice oled, lcd, other;
    registerDevice(&oled, OLED);
    registerDevice(&lcd, LCD);
    registerDevice(&other, DEFAULT_PAINTABLE_DEVICE);

    oled.Draw(&oled);
    lcd.Draw(&lcd);
    other.Draw(&other);
}
```

```text
Oh, I shell paint as if I'm OLED
Oh, I shell paint as if I'm LCD
Oh, I shell paint as if I'm DEFAULT_PAINTABLE_DEVICE
```

​必须承认，这样的多态技术比较的别扭，但是，他完全可以实现动态多态。当我们的OLED设备从IIC总线上被卸下，换上LCD后，假设我们触发了这样的信号被捕捉做Callback。我们完全可以在程序运行的时候就发生切换。

```c
void switchDeviceAsLCD(IPaintableDevice* which_device)
{
    which_device->holding_type = LCD;
    which_device->Draw = draw_lcd;
}

int main()
{
    IPaintableDevice oled, lcd, other;
    registerDevice(&oled, OLED);
    registerDevice(&lcd, LCD);
    registerDevice(&other, DEFAULT_PAINTABLE_DEVICE);

    ...
    
    switchDeviceAsLCD(&oled);
    oled.Draw(&oled);
}
```

​这些技术在底层上，共同构成了更加高级的经典抽象方案------比如说非侵入式的，基于结构体偏移的实现的经典的继承方案------Linux实现其双向循环的list。关于其技术细节不是本篇博客讨论的，涉及到的结构体成员编排方案和潜在的优化风险与应对措施不是我们这里的终点，对之感兴趣的朋友可以自行查阅。

## 类比OOP中属性赋予的办法，我们实现一个多继承的C语言继承方案

​Dessera的博客说的非常出色了，我们的OOP类似实现一个复合属性（Compound-Property）技术的继承方案实际上是这样做的------

```cpp
class Person : public Runnable, Jumpable, Accessible ...
```

​在C语言中，很不幸，没办法做到这样简洁的编程范式。因为C语言的编程风格是从来不做多余的事情，包括但不限于揣摩结构体潜在的继承多态。所以，我们如果只使用经典ISO C的方案（注意，现代C编译器都会多多少少提供自己的编译器扩展，比如说模拟OOP的构造析构属性等），几乎无法完成对上面范式的实现。我们只能按照一种------嗯，非常静态的死板的方法，比如说基于宏的编译静态扩展等方案完成

```c
#include <stdio.h>
typedef struct _IRunnable{
    void (*ConcreateRun)(struct _IRunnable* object);
}Runnable;

typedef struct _IJumpable{
    void (*ConcreateJump)(struct _IJumpable* object);
}Jumpable;

#ifdef _PROPERTY_ACCESSIBLE
typedef struct _IAccessible{
    void (*ConcreateAccessible)(struct _IAccessible* object);
}Accessible;
#endif

typedef struct {
    Runnable    run;
    Jumpable    jmp;
#ifdef _PROPERTY_ACCESSIBLE
    Accessible  accessible;
#endif
}Person;

void personJmp(Jumpable* j){
    (void)j;
    printf("Hey, Man Can Jump!\n");
}

void personRun(Runnable* j){
    (void)j;
    printf("Hey, Man Can Run!\n");
}

#ifdef _PROPERTY_ACCESSIBLE
void personAccess(Accessible* j){
    (void)j;
    printf("Hey, Man Can access!\n");
}
#endif

void on_involkManCreation(Person* p){
    p->run.ConcreateRun = personRun;
    p->jmp.ConcreateJump = personJmp;
#ifdef _PROPERTY_ACCESSIBLE
    p->accessible.ConcreateAccessible = personAccess;
#endif
}

void on_his_talent(Person* p){
    p->run.ConcreateRun(&(p->run));
    p->jmp.ConcreateJump(&(p->jmp));
#ifdef _PROPERTY_ACCESSIBLE
    p->accessible.ConcreateAccessible(&(p->accessible));
#endif
}

int main()
{
    Person p;
    on_involkManCreation(&p);
    on_his_talent(&p);
}
```

```text
gcc demo.c -o demo
Hey, Man Can Run!
Hey, Man Can Jump!
gcc demo.c -D_PROPERTY_ACCESSIBLE -o demo
./demo
Hey, Man Can Run!
Hey, Man Can Jump!
Hey, Man Can access!
```


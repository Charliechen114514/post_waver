---
title: "快速入门C++并发编程"
date: 2025-02-03
---

# 高阶开发基础------快速入门C++并发编程1

## 前言

​这个部分是高阶开发的第一个基础部分，也就是并发编程。笔者需要激进的假设各位已经掌握了基本的C++语法。学习过经典的计算机四件套中的计算机组成原理，操作系统。对并发已经有了最初步的认识。这里，笔者打算做一个偏向于总结性质的博客笔记。来在后续学习更加高阶的开发的时候理解并掌握并发和异步的知识。

## 并发与线程

​笔者先前开过一些线程部分的博客，但是遗憾的是都烂尾了。

> 传送门：
>
> [https://blog.csdn.net/charlie114514191/article/details/138192417](https://blog.csdn.net/charlie114514191/article/details/138192417)
>
> [https://blog.csdn.net/charlie114514191/article/details/138243670](https://blog.csdn.net/charlie114514191/article/details/138243670)

​可以先看这两篇笔者早期的博客进行梳理，但是并不全面。主要是铺垫一下对`std::thread`的理解。

​简单谈到并发就是------发挥机器多核的性能，让同一时间计算机做多个事情。换而言之，就跟我现在左手拿着杯子喝水，右手正在敲键盘，眼睛正在看着我的Typora编辑文档一样。这三个事情我都是在同时进行。这就属于一种并发。相比你很快意识到，并发可以有效的提升程序的性能，对于UI编程，则是特别的提升了程序的响应程度。至少，一个良好设计的UI界面程序不会因为程序做耗时的操作而卡死。

​将飘渺的并发落到实地的就是线程。可以这样认为：我们的主程序被装在一个进程当中（各位看官不着急反驳多进程的进程协作的大型项目，这个属于另外的进程协作话题）后，想要在一个进程的运行时并发的完成任务，就需要开辟多个线程完成指定的任务。这样来看，我们学习C++并发编程，**实际上就是在谈论如何使用C++提供的并发构件完成我们的需求**。更加具体的说，使用std::thread来完成我们在C++中的并发（题外话，是对异步更加感兴趣的了解经典的std::async和std::await，疑似不少人并不知道C++原生提供了简单的异步原语）。

​这里，我们不谈论线程在操作系统的实现。你需要知道的是------任何一个进程，现在是线程，都需要一个任务堆栈完成自己的任务。我们的线程有自己的私有栈，可以认为线程就是一个迷你的进程。也都可以访问，读写进程中的公共数据（我们后面的竞争冒险话题围绕于此）

## 理解std::thread

### 推介cpp reference

​笔者混迹于一些C++的交流群，不少大佬是从这里查询C++提供的脚手架的使用办法。这里提供的是连接：

> English Version:[cppreference.com](https://en.cppreference.com/w/)
>
> 中文版本：[cppreference.com](https://zh.cppreference.com/w/首页)

### 从std::thread开始

​thread就是线程的意思。从编程的角度上，我们需要理解的是

> 提供一个任务和一个任务需要的输入，能够并发的返回给我们一个输出即可。

![image-20250203121606082](/img/articles/2025-02-03-快速入门C-并发编程/image-20250203121606082.png)

​这个图的解读姿势是------左侧是我们这样写代码的流程执行流

```c
int main()
{
    ...
    worker();
    ...
}
```

​当我们使用并发的时候...

```c
int main()
{
    std::thread working_thread = std::thread(worker);
    printf("You see iam still in!");
    working_thread.join();
}
```

​理解这个事情，我们就知道，使用std::thread而且完成了线程启动之后。我们的线程就会立刻的开始执行我们委派的任务，我们继续若无其事的在主线程干好其他的工作即可。

### 如何构造一个std::thread

​很好，那我们应该如何构造一个std::thread呢？这个事情我们可以查看C++ Reference

> [std::thread::thread - cppreference.com](https://zh.cppreference.com/w/cpp/thread/thread/thread)

​可以看到，我们可以移动一个线程，向内传递一个工作函数和它所需要的参数。但是不可以拷贝一个线程（拷贝一个线程是没有意义的，这个你想一下，比起来完成多个任务肯定是委派相同的工作函数带上不同的参数，或者说，没有必要在相同的时间接受相同的输入做同样的事情，更何况带来的冲突会让你喝上两壶！）

```c
#include <cstdio>
#include <print>
#include <string>
#include <thread>

void worker(std::string &value, int &a) {
    a++;
    std::print("handlings the string \n"
               "With the value of ready invoked as \n",
               value, a);
}

int main() {
    std::string value = "hello";
    int ready = 1;
    std::thread th(worker, std::ref(value), std::ref(ready));
    th.join();
}
```

​这就是一个带有参数例子的std::thread构造，当然，你需要知道的是std::ref是一个C++Type traits，用来表达显示的传递一个引用，这是因为thread的参数类型默认按照值进行传递。（这个事情是为了有效引用考虑的，当你使用了std::ref的时候，就保证了你清楚的知道你在传递一个引用！）试一试这个代码！

> 引申思考：传进去将亡值会发生什么？值得提示的是，高版本的编译器会明确阻止你，但是低版本的不会（GCC测试），所以，不要写未定义的程序。（为什么是未定义的？答案是，一些场景下将亡值因为瞬间被使用完毕而赶在了被回收之前，值仍然有效，但是只要程序一个复杂起来，瞬间爆炸的概论大幅度提升）

### 如何确保正确的结束线程

​再来看看这个图：

![image-20250203121606082](/img/articles/2025-02-03-快速入门C-并发编程/image-20250203121606082.png)

​毫无疑问，我们的线程是有始有终的，必须明确好我们的线程是如何终止的。你可以尝试一下：

```c
#include <cstdio>
#include <print>
#include <string>
#include <thread>

void worker(std::string &value, int &a) {
    a++;
    std::print("handlings the string \n"
               "With the value of ready invoked as \n",
               value, a);
}

int main() {
    std::string value = "hello";
    int ready = 1;
    std::thread th(worker, std::ref(value), std::ref(ready));
    // th.join();
}
```

​这个代码有极高的概率崩溃，为什么是概率？因为我们不知道处理器是否会在主线程（Main函数）推出之前把worker执行完毕，既然不知道，那就是UB，当我们没有执行完子线程就退出，线程就会发出异常，程序就会崩溃。解决这个的最好的办法就是讲清楚：

> 你到底是希望在main函数之前要求把活做完呢？（在结尾join线程）还是发出去后就不理睬我们的线程自生自灭了？（将线程detach出去）

​C++中，我们的std::thread的两个重要表达如何处理线程结束的两个成员函数是`join()` 和 `detach()` ，他们用于控制线程的生命周期。

​`join()` 用于等待线程执行完毕。调用 `join()` 的线程会阻塞，直到被调用的线程完成其任务。如果我们构造一个非空的线程立马join，那么就会变成同步原语，所以，一般是在主线程做好了一些事情后调用join来等待线程。所以，当你需要确保一个线程在继续执行主线程或其他线程之前完成其任务时，使用 `join()`。下面是一个简单的join的小例子

```c
#include <iostream>
#include <thread>

void task() {
    std::cout << "Thread is running..." << std::endl;
}

int main() {
    std::thread t(task);
    t.join();  // 等待线程t执行完毕
    std::cout << "Thread has finished." << std::endl;
    return 0;
}
```

​`detach()` 用于将线程与 `std::thread` 对象分离，使得线程在后台独立运行。调用 `detach()` 后，`std::thread` 对象不再与该线程关联，线程的资源会在其完成任务后自动释放。换而言之，他坐完事就让他自生自灭了，那就使用detach，让他自己干活，我们不会跟他产生任何直接联系了，这个时候使用detach就能很好的表达我们的含义（当你不需要等待线程完成，或者希望线程在后台运行时，使用 `detach()`。）。当然很少用。一般都是join的

```c
#include <iostream>
#include <thread>

void task() {
    std::cout << "Thread is running..." << std::endl;
}

int main() {
    std::thread t(task);
    t.detach();  // 将线程t分离，使其在后台运行
    std::cout << "Thread is detached." << std::endl;
    // 主线程继续执行，不等待t完成
    return 0;
}
```

#### 注意

​我们的join和detach都只能调用一次，C++使用了一个方法叫做joinable来检查我们能不能对一个线程进行join和detach。

```c
#include <iostream>
#include <thread>
void foo() {
    std::cout << "Thread started" << std::endl;
    // ...
    std::cout << "Thread about to quit" << std::endl;
}
int main() {
    std::thread t(foo);
    if (t.joinable()) {
        std::cout << "Thread is joinable, join the thread right now" << std::endl;
        t.join();
    }
    std::cout << "Thread has been joined" << std::endl;
    return 0;
}
```

​这样的程序才是健壮的!

# Reference

> [cppreference.com](https://zh.cppreference.com/w/首页)\
> [1. C++11 Thead线程库的基本使用-See的编程日记 (seestudy.cn)](http://www.seestudy.cn/?list_9/31.html)

# 高阶开发基础------快速入门C++并发编程2

## 常见的几个经典错误------1: 关于内存访问的几个经典的错误

​为了深入的理解一些潜在的错误，笔者设计了一个这样的样例，各位请看：

```c
#include <chrono>
#include <thread>

std::thread th;
void inc_ref(int &ref) {
    std::this_thread::sleep_for(std::chrono::seconds(1));
    ref++;
}

void worker() {
    int value = 1;
    th = std::thread(inc_ref, std::ref(value));
}

int main()
{
    worker();
    th.join();
}
```

​你发现问题了嘛？

​答案是，worker是一个同步函数，我们的value的作用域隶属于worker函数的范围内，现在，worker一旦将th线程派发出去，里面的工作函数的引用ref就会非法。现在，我们对一个非法的变量自增，自然就会爆错

```text
➜  make
[ 50%] Building CXX object CMakeFiles/demo.dir/main.cpp.o
[100%] Linking CXX executable demo
[100%] Built target demo
➜  ./demo 
Segmentation fault (core dumped)
```

> 扩展：
>
> 1.  关于C++的时间库，C++的时间库抽象了几个经典的必要的时间操作，因此，使用这个库来表达我们的时间非常的方便。
>
> -   **`std::chrono::duration`**: 表示时间间隔，例如 5 秒、10 毫秒等。
> -   **`std::chrono::time_point`**: 表示一个时间点，通常是相对于某个纪元（如 1970 年 1 月 1 日）的时间。
> -   **`std::chrono::system_clock`**: 系统范围的实时时钟，表示当前的日历时间。
> -   **`std::chrono::steady_clock`**: 单调时钟，适用于测量时间间隔，不会受到系统时间调整的影响。
> -   **`std::chrono::high_resolution_clock`**: 高精度时钟，通常是 `steady_clock` 或 `system_clock` 的别名。
>
> ```
> #include <iostream>
> #include <chrono>
>
> int main() {
>     // 定义一个 5 秒的时间间隔
>     std::chrono::seconds duration(5);
>
>     // 获取当前时间点
>     auto start = std::chrono::steady_clock::now();
>
>     // 模拟一些操作
>     std::this_thread::sleep_for(duration);
>
>     // 获取结束时间点
>     auto end = std::chrono::steady_clock::now();
>
>     // 计算时间间隔
>     auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
>
>     std::cout << "Elapsed time: " << elapsed.count() << " ms" << std::endl;
>
>     return 0;
> }
> ```
>
> 1.  `std::this_thread::sleep_for`
>
> `std::this_thread::sleep_for` 是 C++11 引入的函数，用于使当前线程休眠指定的时间。它接受一个 `std::chrono::duration` 类型的参数，表示休眠的时间长度。这个this_thread表达的是当前的运行线程的线程句柄，也就是说，调用这个函数表达了运行这个函数的当前线程实体休眠若干秒
>
> ```
> #include <iostream>
> #include <thread>
> #include <chrono>
>
> int main() {
>     std::cout << "Sleeping for 2 seconds..." << std::endl;
>
>     // 使当前线程休眠 2 秒
>     std::this_thread::sleep_for(std::chrono::seconds(2));
>
>     std::cout << "Awake!" << std::endl;
>
>     return 0;
> }
> ```
>
> 笔者在这里故意延迟，是为了让worker有时间清理他自己的函数栈，让程序必然报错。但是在项目中，很有可能线程在worker清理完之前就执行完成了，这会导致给项目埋雷，引入非常大的不确定性。

​这样的例子还有对堆上的内存，这同样管用：

```c
#include <chrono>
#include <thread>
#include <print>

std::thread th;
void inc_ref(int* ref) {
    std::this_thread::sleep_for(std::chrono::seconds(1));
    (*ref)++;
    std::print("value of the ref points to is \n", *ref);
}

void worker() {
    int* value = new int;
    *value = 1;
    th = std::thread(inc_ref, value);
    delete value; // free immediately
}

int main()
{
    worker();
    th.join();
}
```

​程序一样会崩溃，这里，我们没有协调内存块的声明周期。一个很好的办法就是使用智能指针，关于智能指针，笔者再最早期写过两篇博客介绍：

> [C++智能指针1](https://blog.csdn.net/charlie114514191/article/details/136489270)
>
> [C++智能指针2](https://blog.csdn.net/charlie114514191/article/details/136573103)

​也就是保持变量的引用到最后一刻，不用就释放！

## 解决多线程流对单一数据的写问题

​可变性！并发编程中一个最大的议题就是讨论对贡献数据的写同步性问题。现在，我们来看一个例子

```c
static int shared_value;
void worker_no_promise() {
    for (int i = 0; i < 1000000; i++) {
        shared_value++;
    }
}

int main() {
    auto thread1 = std::thread(worker_no_promise);
    auto thread2 = std::thread(worker_no_promise);
    thread1.join();
    thread2.join();

    std::print("value of shared is: \n", shared_value);
}
```

​你猜到问题了嘛？

```text
➜  make && ./demo
[ 50%] Building CXX object CMakeFiles/demo.dir/main.cpp.o
[100%] Linking CXX executable demo
[100%] Built target demo
value of shared is: 1173798
```

​奇怪？为什么不是200000呢？答案是非原子操作！这是因为一个简单的自增需要------将数据从内存中加载，操作，放回内存中------遵循这三个基本的步骤。所以，可能我们的两个线程从内存中加载了同样的数，自增放回去了也就会是相同的数，两个线程实际上只加了一次。甚至，可能没有增加！（这个你可以自己画图求解，笔者不在这里花费时间了）

​如何处理，我们下面引出的是锁这个概念。

## std::mutex

​mutex就是锁的意思。它的意思很明白------那就是对共享的数据部分进行"上锁"，当一个线程持有了这个锁后，其他的线程想要请求这个锁就必须门外竖着------阻塞等待。

```c
static int shared_value;
std::mutex mtx;
void worker() {
    for (int i = 0; i < 1000000; i++) {
        mtx.lock();
        shared_value++;
        mtx.unlock();
    }
}

int main() {
    auto thread1 = std::thread(worker);
    auto thread2 = std::thread(worker);
    thread1.join();
    thread2.join();

    std::print("value of shared is: \n", shared_value);
}
```

​现在我们的结果相当好！

```text
➜  make && ./demo
[ 50%] Building CXX object CMakeFiles/demo.dir/main.cpp.o
[100%] Linking CXX executable demo
[100%] Built target demo
value of shared is: 2000000
```

​事实上，只要不超过INT64_MAX的值，相加的结果都应该是正确的！

# 高阶开发基础------快速入门C++并发编程3

## 关于互斥量死锁

​上一篇博客中，我们看到了mutex可以保护数据，但是这也引来了新的麻烦，那就是互斥量的死锁。

​互斥量（Mutex）是用于保护共享资源的一种同步机制。死锁（Deadlock）是指多个线程或进程因竞争资源而陷入相互等待的状态，导致程序无法继续执行。死锁通常发生在以下四个条件同时满足时：

1.  **互斥条件**：资源一次只能被一个线程占用。
2.  **占有并等待**：线程持有至少一个资源，并等待获取其他被占用的资源。
3.  **非抢占条件**：线程已持有的资源不能被其他线程强行抢占，只能由线程主动释放。
4.  **循环等待条件**：存在一个线程的循环链，每个线程都在等待下一个线程所持有的资源。

​说的很空，我们现在来看一段代码：

```c
#include <iostream>
#include <thread>
#include <mutex>

std::mutex mutex1;
std::mutex mutex2;

void thread1() {
    std::lock_guard<std::mutex> lock1(mutex1);
    std::this_thread::sleep_for(std::chrono::milliseconds(100)); // 模拟一些操作
    std::lock_guard<std::mutex> lock2(mutex2);
    std::cout << "Thread 1 finished" << std::endl;
}

void thread2() {
    std::lock_guard<std::mutex> lock2(mutex2);
    std::this_thread::sleep_for(std::chrono::milliseconds(100)); // 模拟一些操作
    std::lock_guard<std::mutex> lock1(mutex1);
    std::cout << "Thread 2 finished" << std::endl;
}

int main() {
    std::thread t1(thread1);
    std::thread t2(thread2);

    t1.join();
    t2.join();

    return 0;
}
```

​上面的代码就是一段死锁代码。分析一下，thread1先启动了，快速的占用了mutex1，thread2随后占用了mutex1.麻烦来了，现在做好了一系列操作后，我们马上有需要获取第二个锁，对于thread1而言，他要拿到mutex2，就必须让thread2放掉他自己手中的mutex2，但是，thread2想要放掉自己的mutex2，就必须拿到thread1手中的mutex1...好！你一眼发现，这是双方都盯着对方的资源而不肯松手自己的资源导致的，现在程序卡死了。

## 解决方案

### 顺序上锁。

```cpp
void thread1() {
    std::lock_guard<std::mutex> lock1(mutex1);
    std::this_thread::sleep_for(std::chrono::milliseconds(100)); // 模拟一些操作
    std::lock_guard<std::mutex> lock2(mutex2);
    std::cout << "Thread 1 finished" << std::endl;
}

void thread2() {
    std::lock_guard<std::mutex> lock2(mutex2);
    std::this_thread::sleep_for(std::chrono::milliseconds(100)); // 模拟一些操作
    std::lock_guard<std::mutex> lock1(mutex1);
    std::cout << "Thread 2 finished" << std::endl;
}
```

​你看，这是资源锁获取顺序不一致导致的。调成一致，就可以有效的回避死锁（必须按照顺序请求资源），但麻烦之处在于，我们就丧失了一定的灵活性！所以，当资源的请求顺序是无所谓的时候，可以采用这个办法。但是，效率必然不会高！

​另一个办法是------优化自己的编程思路，看看是不是真的不得不用多重锁，如果优化到后面，发现可以使用其他方案解决，那就更好了。

### 超时机制

​还有一种，如果你的上锁是比较宽松的，允许获取锁失败，可以尝试使用超时集制：

```cpp
std::timed_mutex mutex1;
std::timed_mutex mutex2;

void thread1() {
    auto start = std::chrono::steady_clock::now();
    while (true) {
        // 愿意花费500ms时间等待 
        if (mutex1.try_lock_for(std::chrono::milliseconds(100))) {
            // 愿意花费500ms时间等待 
            if (mutex2.try_lock_for(std::chrono::milliseconds(100))) {
                // works...
                std::cout << "Thread 1 finished" << std::endl;
                mutex2.unlock();
                mutex1.unlock();
                return;
            }
            mutex1.unlock();
        }
        // 如果超过1s没有拿到锁，放弃，退到后面我们处理
        if (std::chrono::steady_clock::now() - start > std::chrono::seconds(1)) {
            std::cout << "Thread 1 timeout" << std::endl;
            return;
        }
    }
}
```

## 使用RAII来保证锁的恰当释放

​哎呀！很不小心的，我们写下了这段代码：

```c
static int shared_value;
std::mutex mtx;
void worker() {
    for (int i = 0; i < 1000000; i++) {
        mtx.lock();
        shared_value++;
    }
}

int main() {
    auto thread1 = std::thread(worker);
    auto thread2 = std::thread(worker);
    thread1.join();
    thread2.join();

    std::print("value of shared is: \n", shared_value);
}
```

​你看到问题了嘛？答案是------我们的锁忘记解锁了，再下一轮循环中，请求一个永远不可能解锁的锁！因为锁了锁的人是过去的他自己！

​麻烦了，这个倒还好，如果我们的逻辑非常复杂，如何保证我们自己还记得释放锁呢？答案是请出来万能的RAII机制。

```cpp
 /** @brief A simple scoped lock type.
   *
   * A lock_guard controls mutex ownership within a scope, releasing
   * ownership in the destructor.
   *
   * @headerfile mutex
   * @since C++11
   */
  template<typename _Mutex>
    class lock_guard
    {
    public:
      typedef _Mutex mutex_type;

      [[__nodiscard__]]
      explicit lock_guard(mutex_type& __m) : _M_device(__m)
      { _M_device.lock(); }

      [[__nodiscard__]]
      lock_guard(mutex_type& __m, adopt_lock_t) noexcept : _M_device(__m)
      { } // calling thread owns mutex

      ~lock_guard()
      { _M_device.unlock(); }

      lock_guard(const lock_guard&) = delete;
      lock_guard& operator=(const lock_guard&) = delete;

    private:
      mutex_type&  _M_device;
    };

  /// @} group mutexes
_GLIBCXX_END_NAMESPACE_VERSION
} // namespace
```

​看懂了嘛？这就是RAII思路设计的lock_guard。就是说，当我们构造了一个类lock_guard开始，我们就对他立马进行上锁，到出作用域，程序马上就要放手没法管住mutex的控制的时候，手动的进行释放处理操作，在这里，释放的操作就是将锁进行解锁（显然我们的锁必然已经被上锁了，因为锁在被lock_guard控制的一瞬间就调用了lock方法！）

​但是还是不够灵活，我们如果想自己控制锁的范围，办法是------使用unique_ptr的姊妹类------unique_lock

-   `unique_lock(mutex_type& m, defer_lock_t) noexcept`：构造函数，使用给定的互斥量 `m` 进行初始化，但不对该互斥量进行加锁操作。
-   `unique_lock(mutex_type& m, try_to_lock_t) noexcept`：构造函数，使用给定的互斥量 `m` 进行初始化，并尝试对该互斥量进行加锁操作。如果加锁失败，则创建的 `std::unique_lock` 对象不与任何互斥量关联。
-   `unique_lock(mutex_type& m, adopt_lock_t) noexcept`：构造函数，使用给定的互斥量 `m` 进行初始化，并假设该互斥量已经被当前线程成功加锁。

# 高阶开发基础------快速入门C++并发编程4

## 使用call_once来确保调用的唯一性

​一个相似的概念是------单例模式，笔者找到的是stack_overflow的一个问答，如果不喜欢看英文，可以考虑看一下这个CSDN回答：

> [c++ - How do you implement the Singleton design pattern? - Stack Overflow](https://stackoverflow.com/questions/1008019/how-do-you-implement-the-singleton-design-pattern)
>
> [【C++】C++ 单例模式总结（5种单例实现方法）\_单例模式c++实现-CSDN博客](https://blog.csdn.net/unonoi/article/details/121138176)

​总而言之，单例模式就是保证在多线程中对象的唯一性。C++11预料了这样的场景，因为十分多见（比如说初始化日志和初始化单一数据库等等）

​所以，call_once就被用来保证在多个线程中只执行一次的用法。

### 先看我们的原始的单例模式

```c
#include <cstdio>
#include <print>
#include <mutex>

class Logger;
Logger* global_logger_instance = nullptr;

class Logger
{
public:
    // disable the copy
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

    static Logger& instance(){
        __pvt_init();
        return *global_logger_instance;
    }

    static void write_logger(const std::string& info){
        std::print("\n", info);
    }

private:
    static void __pvt_init(){
        if(!global_logger_instance){
            global_logger_instance = new Logger;
            std::print("Logger is inited for once\n");
        }
    }
    Logger() = default;
};

void make_logging()
{
    Logger::instance().write_logger("hello");
    Logger::instance().write_logger("world");
    Logger::instance().write_logger("It can be promised");
    Logger::instance().write_logger("that the logger written only");
    Logger::instance().write_logger("once!");
}

int main()
{
    make_logging();
}
```

​**这是一种，非常线程不安全的实现**，虽然这个代码在单线程中显然可以正确的工作，但是遗憾的是，只要放到多线程中，我们的初始化就会出现问题，很有可能导致潜在的双重初始化！

​所以，办法就是请出我们的call_once来解决我们多线程单一执行问题：

```c
#include <cstdio>
#include <print>
#include <mutex>
#include <thread>
class Logger;
Logger* global_logger_instance = nullptr;
std::once_flag promising_flag;

class Logger
{
public:
    // disable the copy
    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

    static Logger& instance(){
        std::call_once(promising_flag, __pvt_init);
        return *global_logger_instance;
    }

    static void write_logger(const std::string& info){
        std::print("\n", info);
    }

private:
    static void __pvt_init(){
        if(!global_logger_instance){
            global_logger_instance = new Logger;
            std::print("Logger is inited for once\n");
        }
    }
    Logger() = default;
};

void make_logging()
{
    Logger::instance().write_logger("hello");
    Logger::instance().write_logger("world");
    Logger::instance().write_logger("It can be promised");
    Logger::instance().write_logger("that the logger written only");
    Logger::instance().write_logger("once!");
}

int main()
{
    std::thread pools[20];
    for(int i = 0; i < 20; i++){
        pools[i] = std::thread{make_logging};
    }

    for(int i = 0; i < 20; i++){
        pools[i].join();
    }
}
```

​现在，我们创建若干的线程并不会发生多重初始化的问题！

# 高阶开发基础------快速入门C++并发编程5 信号量的使用

## 简单说说condition_variable

​condition_varaible是mutex的一个更加高阶的使用。它用来负责简化资源的请求和使用。或者说，他让多个线程对资源的使用变得有序。

​一个代表性的例子就是我们的消费生产模型。假设有两个线程，一个线程负责生产数据，另一个线程负责消费数据。生产线程需要等到消费线程处理完数据后才能继续生产，而消费线程需要等到有数据时才能开始消费。

这时候就可以用 `condition_variable` 来实现：

1.  **等待条件**：消费线程发现没有数据时，会调用 `condition_variable` 的 `wait()` 函数进入等待状态，直到生产线程通知它有数据了。
2.  **通知条件**：生产线程生产完数据后，调用 `condition_variable` 的 `notify_one()` 或 `notify_all()` 函数，告诉消费线程"数据准备好了，可以开始消费了"。

简单来说，`condition_variable` 就像是一个信号灯：

-   线程可以在这个信号灯前等待（`wait()`），直到其他线程发出信号（`notify()`）。
-   当信号发出后，等待的线程就会被唤醒，继续执行。

**它的核心作用是避免线程忙等待（不断检查条件是否成立），从而节省 CPU 资源。**

## 一个例子

​我们就对上面的例子进行编程

```c
#include <chrono>
#include <condition_variable>
#include <mutex>
#include <print>
#include <queue>
#include <thread>
std::mutex mtx;
std::queue<int> global_working_queue;
std::condition_variable global_con_var;

bool shell_stop = false;
void producer() {
    for (int i = 0; i < 50; i++) {
        {
            std::unique_lock<std::mutex> locker(mtx);
            global_working_queue.push(i);
            global_con_var.notify_one();
            std::print("we push  into the task\n", i);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
    shell_stop = true;
}

void consumer() {
    while (!shell_stop) {
        std::unique_lock<std::mutex> locker(mtx);
        // if the queue is empty, we need to wait
        global_con_var.wait(locker, [](){return !global_working_queue.empty() || !shell_stop;});
        if(global_working_queue.empty()){
            continue;
        }
        
        int value = global_working_queue.front();
        global_working_queue.pop();
        std::print("Fetch the value in consumer \n", value);
    }
}

int main() {
    auto pro = std::thread(producer);
    auto con = std::thread(consumer);

    pro.join();
    con.join();
}
```

​在这个例子中，笔者让一个消费者源源不断的往里塞入数据。每当我们塞好了数据，就会通知我们的线程取出数据。进行消费。对于生产者，则是每一次准备处理数据的时候，先向条件变量请示一下，我可不可以进行处理。条件变量依据我们的判断条件，当我们的输入不是队列空的时候，就不需要等待，直接处理队列内数据（wait的判断条件要求的是当为真的适合不去等待，假的时候（也就是资源此时不可以被请求，你要等待）的时候休眠，直到消费者线程提醒你你要起来处理数据）

# 高阶开发基础------快速入门C++并发编程6------大作业：实现一个超级迷你的线程池

## 实现一个无返回的线程池

​实现一个简单的线程池非常简单，我们首先聊一聊线程池的定义：

​**线程池（Thread Pool）** 是一种并发编程的设计模式，用于管理和复用多个线程，以提高程序的性能和资源利用率。它的核心思想是预先创建一组线程，并将任务分配给这些线程执行，而不是为每个任务单独创建和销毁线程。线程池广泛应用于需要处理大量短期任务的场景，例如 Web 服务器、数据库连接池、任务调度系统等。换而言之，线程池说白了就是一种饿汉思维------直接预先提供若干的线程，由线程池内部控制调度，确保我们可以只关心任务的提交以及完成。

​我们下面要做的是设计一个任务是不返回的线程池。所以，我们约束我们的函数是：

```cpp
using supportive_task_type = std::function<void()>;
```

​下一步，就是构造我们的线程池的线程。注意的是------线程和任务是解耦合的，意味着我们需要一个中间函数解耦合任务派发。笔者决定，将任务派发分到一个私有函数完成：

```text
CCThreadPool(const int workers_num) {
    for(int i = 0; i < workers_num; i++){
        internal_threads.emplace_back(
        [this](){
            __scheduled();
        }
    );
    }
}
```

​上面这个代码很简单，就是将每一个线程都分配一个调度函数，这个调度函数来委派分发任务，办法说简单也很简单：

```cpp
void __scheduled(){
        while(1){
            // sources protections
            std::unique_lock<std::mutex> locker(internal_mutex);
            // waiting for the access of the task resources
            controlling_cv.wait(locker, [this]{
                return thread_pool_status || !tasks_queue.empty();}
            );
            // quit if requried
            if(thread_pool_status && tasks_queue.empty()){
                return;
            }
            
            // 现在我们可以取到任务执行了
            supportive_task_type task(std::move(tasks_queue.front()));
            tasks_queue.pop();
            locker.unlock();
            task();
        }
    }
```

​当析构的时候，我们也要通知所有线程的cv不要睡眠了，由于设置了`thread_pool_status`是true，直接线程跳出来结束全文。

```text
~CCThreadPool(){
    thread_pool_status = true;
    controlling_cv.notify_all();
    for(auto& thread : internal_threads){
        thread.join();
    }
}
```

​

## 完全代码实现

```cpp
#include <condition_variable>
#include <functional>
#include <mutex>
#include <print>
#include <queue>
#include <thread>
#include <utility>
#include <vector>

class CCThreadPool {
  public:
    CCThreadPool()                          = delete;
    CCThreadPool(const CCThreadPool &)      = delete;
    CCThreadPool &operator=(CCThreadPool &) = delete;

    CCThreadPool(const int workers_num) {
        for(int i = 0; i < workers_num; i++){
            internal_threads.emplace_back(
            [this](){
                __scheduled();
            }
        );
        }
    }

    ~CCThreadPool(){
        thread_pool_status = true;
        controlling_cv.notify_all();
        for(auto& thread : internal_threads){
            thread.join();
        }
    }

    template<typename F, typename... Args>
    void enTask(F&& f, Args&&... args){
        supportive_task_type task(
            std::bind(std::forward<F&&>(f), std::forward<Args&&>(args)...));
        {
            std::unique_lock<std::mutex> locker(internal_mutex);
            tasks_queue.emplace(std::move(task));
        }
        controlling_cv.notify_one();
    }

  private:
    void __scheduled(){
        while(1){
            std::unique_lock<std::mutex> locker(internal_mutex);
            controlling_cv.wait(locker, [this]{
                return thread_pool_status || !tasks_queue.empty();}
            );
            // quit
            if(thread_pool_status && tasks_queue.empty()){
                return;
            }
            supportive_task_type task(std::move(tasks_queue.front()));
            tasks_queue.pop();
            locker.unlock();
            task();
        }
    }

    using supportive_task_type = std::function<void()>;
    std::vector<std::thread> internal_threads;
    std::queue<supportive_task_type> tasks_queue;
    std::mutex internal_mutex;
    std::condition_variable controlling_cv;
    bool thread_pool_status = false;
};

int main()
{
    std::println("Task start");
    CCThreadPool pool(4);
    
    for (int i = 0; i < 8; ++i) {
        pool.enTask([i] {
            std::println("Task  is started at thread with id ", i, std::this_thread::get_id());
            std::this_thread::sleep_for(std::chrono::seconds(1));
            std::println("Task  is done", i);
        });
    }
    return 0;
}
```

# Reference

> [8. C++11 跨平台线程池-See的编程日记 (seestudy.cn)](http://www.seestudy.cn/?list_9/41.html)


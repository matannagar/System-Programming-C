FLAGS = -Wall -g
mymaths=libmyMath.a
mymathd=libmyMath.so


all: mymathd mymaths mains maind 
mains: main.o libmyMath.a
	gcc -Wall -g -o mains main.o libmyMath.a
maind: main.o
	gcc $(FLAGS) -o maind main.o ./libmyMath.so
	
mymathd: libmyMath.so
libmyMath.so: basicMath.o power.o
	gcc -shared -o libmyMath.so basicMath.o power.o

mymaths: libmyMath.a
libmyMath.a: basicMath.o power.o
	ar -rcs libmyMath.a basicMath.o power.o
main.o: main.c myMath.h
	gcc $(FLAGS) -c main.c
basicMath.o: basicMath.c myMath.h
	gcc $(FLAGS) -c basicMath.c 
power.o: power.c myMath.h
	gcc $(FLAGS) -c power.c  

.PHONY: clean all

clean:
	rm -f *.o *.a *.so *.exe mains maind

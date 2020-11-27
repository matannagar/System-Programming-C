all: libmyBank.a mains
libmyBank.a: myBank.o
	ar -rcs libmyBank.a myBank.o
mains: main.o libmyBank.a
	gcc -Wall -g -o mains main.o libmyBank.a

main.o: main.c myBank.h
	gcc -Wall -g -c main.c

myBank.o: myBank.c myBank.h
	gcc -Wall -g -c myBank.c

.PHONY: clean all
clean:
	rm -f *.o *.a *.so *.exe

all: mainSort maintxtfind

mainSort: mainSort.o 
	gcc -Wall -g -o isort mainSort.o

mainSort.o: mainSort.c
	gcc -Wall -g -c mainSort.c

maintxtfind: maintxtfind.o
	gcc -Wall -g -o txtfind maintxtfind.o

maintxtfind.o: maintxtfind.c
	gcc -Wall -g -c maintxtfind.c
	


.PHONY: clean all
clean:
	rm -f *.o *.a *.so *.exe txtfind isort


import React, { useState } from 'react';
import { Calculator, ChevronDown, ChevronUp, Delete, Equal } from 'lucide-react';
// @ts-ignore
import { evaluate } from 'mathjs';

export const ScientificCalculator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const handlePress = (val: string) => {
    setExpression(prev => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setResult('');
  };

  const handleDelete = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleCalculate = () => {
    try {
      if (!expression) return;
      // Replace visual symbols with mathjs compatible ones
      const sanitized = expression
        .replace('×', '*')
        .replace('÷', '/')
        .replace('π', 'pi')
        .replace('√', 'sqrt');
      
      const res = evaluate(sanitized);
      const resStr = String(parseFloat(res.toFixed(8))); // Clean up floating point errors
      
      setResult(resStr);
      setHistory(prev => [`${expression} = ${resStr}`, ...prev.slice(0, 4)]);
    } catch (error) {
      setResult('Error');
    }
  };

  const btns = [
    ['sin', 'cos', 'tan', 'deg', 'AC'],
    ['7', '8', '9', '÷', 'DEL'],
    ['4', '5', '6', '×', '('],
    ['1', '2', '3', '-', ')'],
    ['0', '.', 'π', '+', '√'],
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 overflow-hidden mt-4 transition-all">
      <div 
        className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
           <span className="bg-green-600 text-white p-1 rounded-md"><Calculator size={18}/></span>
           <span>Máy Tính Khoa Học</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className="p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-gray-50 dark:bg-black p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                {/* Screen */}
                <div className="mb-4 text-right">
                    <div className="text-gray-400 text-sm h-5 overflow-hidden">{history[0] || ''}</div>
                    <div className="text-2xl md:text-3xl font-mono text-gray-900 dark:text-white break-all tracking-wider py-2">
                        {expression || '0'}
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-green-600 h-8">
                        {result ? `= ${result}` : ''}
                    </div>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-5 gap-2">
                    {btns.map((row, rIdx) => (
                        <React.Fragment key={rIdx}>
                            {row.map((btn) => {
                                let bgClass = "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";
                                let action = () => handlePress(btn);

                                if (['AC', 'DEL'].includes(btn)) {
                                    bgClass = "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50";
                                    if (btn === 'AC') action = handleClear;
                                    if (btn === 'DEL') action = handleDelete;
                                } else if (['÷', '×', '-', '+', '√', '(', ')'].includes(btn)) {
                                    bgClass = "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40";
                                } else if (['sin', 'cos', 'tan', 'deg', 'π'].includes(btn)) {
                                    bgClass = "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold";
                                    if (btn === 'deg') return <div key={btn} className="flex items-center justify-center text-[10px] text-gray-400">RAD</div>;
                                    action = () => handlePress(btn + '(');
                                    if(btn === 'π') action = () => handlePress(btn);
                                }

                                return (
                                    <button
                                        key={btn}
                                        onClick={action}
                                        className={`${bgClass} rounded-lg p-3 md:p-4 shadow-sm active:scale-95 transition-transform flex items-center justify-center font-bold text-sm md:text-base select-none`}
                                    >
                                        {btn === 'DEL' ? <Delete size={18} /> : btn}
                                    </button>
                                );
                            })}
                        </React.Fragment>
                    ))}
                    <button 
                        onClick={handleCalculate}
                        className="col-span-5 bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 shadow-lg active:scale-95 transition-all font-bold text-lg flex items-center justify-center gap-2"
                    >
                        <Equal size={24} /> Tính Toán
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
